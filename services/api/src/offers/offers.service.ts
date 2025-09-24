import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferResponseDto, PublicOfferResponseDto } from './dto/offer-response.dto';
import { Offer, OfferAudience, UserRole } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async create(
    createOfferDto: CreateOfferDto,
    userId: string,
    imagePath: string,
  ): Promise<OfferResponseDto> {
    // Validate dates
    if (createOfferDto.startsAt && createOfferDto.endsAt) {
      const startsAt = new Date(createOfferDto.startsAt);
      const endsAt = new Date(createOfferDto.endsAt);
      
      if (startsAt >= endsAt) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    const offer = await this.prisma.offer.create({
      data: {
        ...createOfferDto,
        imagePath,
        createdBy: userId,
        startsAt: createOfferDto.startsAt ? new Date(createOfferDto.startsAt) : null,
        endsAt: createOfferDto.endsAt ? new Date(createOfferDto.endsAt) : null,
      },
    });

    return this.mapToResponseDto(offer);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    audience?: OfferAudience,
    isActive?: boolean,
  ): Promise<{ data: OfferResponseDto[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const where = {
      deletedAt: null,
      ...(audience && { audience }),
      ...(isActive !== undefined && { isActive }),
    };

    const [offers, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.offer.count({ where }),
    ]);

    return {
      data: offers.map(offer => this.mapToResponseDto(offer)),
      total,
      page,
      limit,
    };
  }

  async findPublicOffers(audience?: OfferAudience): Promise<PublicOfferResponseDto[]> {
    const now = new Date();
    
    const offers = await this.prisma.offer.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
        ...(audience && {
          OR: [
            { audience },
            { audience: OfferAudience.ALL },
          ],
        }),
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return offers.map(offer => ({
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle,
      ctaText: offer.ctaText,
      imagePath: offer.imagePath,
      targetUrl: offer.targetUrl,
      audience: offer.audience,
      sortOrder: offer.sortOrder,
    }));
  }

  async findOne(id: string): Promise<OfferResponseDto> {
    const offer = await this.prisma.offer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return this.mapToResponseDto(offer);
  }

  async update(
    id: string,
    updateOfferDto: UpdateOfferDto,
    userId: string,
    userRole: UserRole,
    imagePath?: string,
  ): Promise<OfferResponseDto> {
    const existingOffer = await this.prisma.offer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingOffer) {
      throw new NotFoundException('Offer not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && existingOffer.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own offers');
    }

    // Validate dates if provided
    if (updateOfferDto.startsAt && updateOfferDto.endsAt) {
      const startsAt = new Date(updateOfferDto.startsAt);
      const endsAt = new Date(updateOfferDto.endsAt);
      
      if (startsAt >= endsAt) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Delete old image if new one is uploaded
    if (imagePath && existingOffer.imagePath !== imagePath) {
      await this.deleteImageFile(existingOffer.imagePath);
    }

    const updateData = {
      ...updateOfferDto,
      ...(imagePath && { imagePath }),
      ...(updateOfferDto.startsAt && { startsAt: new Date(updateOfferDto.startsAt) }),
      ...(updateOfferDto.endsAt && { endsAt: new Date(updateOfferDto.endsAt) }),
    };

    const updatedOffer = await this.prisma.offer.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponseDto(updatedOffer);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const offer = await this.prisma.offer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN && offer.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own offers');
    }

    // Soft delete
    await this.prisma.offer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Optionally delete image file after soft delete
    // await this.deleteImageFile(offer.imagePath);
  }

  async updateSortOrder(offersOrder: { id: string; sortOrder: number }[]): Promise<void> {
    const updatePromises = offersOrder.map(({ id, sortOrder }) =>
      this.prisma.offer.update({
        where: { id },
        data: { sortOrder },
      }),
    );

    await Promise.all(updatePromises);
  }

  private async deleteImageFile(imagePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), 'uploads', imagePath);
      if (existsSync(fullPath)) {
        await fs.unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting image file:', error);
    }
  }

  private mapToResponseDto(offer: any): OfferResponseDto {
    return {
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle,
      ctaText: offer.ctaText,
      imagePath: offer.imagePath,
      targetUrl: offer.targetUrl,
      audience: offer.audience,
      isActive: offer.isActive,
      startsAt: offer.startsAt,
      endsAt: offer.endsAt,
      sortOrder: offer.sortOrder,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
  }
}