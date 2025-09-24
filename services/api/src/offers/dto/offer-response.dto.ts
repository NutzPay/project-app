import { OfferAudience } from '@prisma/client';

export class OfferResponseDto {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  imagePath: string;
  targetUrl: string;
  audience: OfferAudience;
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PublicOfferResponseDto {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  imagePath: string;
  targetUrl: string;
  audience: OfferAudience;
  sortOrder: number;
}