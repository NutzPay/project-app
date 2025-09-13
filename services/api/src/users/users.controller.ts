import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('apikey')
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    // If not super admin, limit to own company
    const companyId = req.user.role === UserRole.SUPER_ADMIN 
      ? createUserDto.companyId 
      : req.user.companyId;

    return this.usersService.create({
      ...createUserDto,
      company: { connect: { id: companyId } },
    });
  }

  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Get()
  findAll(@Request() req, @Query('companyId') companyId?: string) {
    // Super admins can see all users, others only their company
    const filterCompanyId = req.user.role === UserRole.SUPER_ADMIN 
      ? companyId 
      : req.user.companyId;

    return this.usersService.findAll(filterCompanyId);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}