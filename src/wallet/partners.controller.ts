import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@prisma/client';
import * as crypto from 'crypto';

@ApiTags('Partners (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
@Controller('admin/partners')
export class PartnersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all partners (admin only)' })
  @ApiResponse({ status: 200 })
  async getAllPartners(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [partners, total] = await Promise.all([
      this.prisma.partner.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      }),
      this.prisma.partner.count(),
    ]);

    return {
      data: partners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create partner (admin only)' })
  @ApiResponse({ status: 201 })
  async createPartner(@Body() dto: CreatePartnerDto) {
    const apiKey = crypto.randomBytes(32).toString('hex');

    return this.prisma.partner.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        websiteUrl: dto.websiteUrl,
        apiKey,
        maxCoinsPerTxn: dto.maxCoinsPerTxn,
      },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update partner (admin only)' })
  @ApiResponse({ status: 200 })
  async updatePartner(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerDto,
  ) {
    // Get old API key before update
    const oldPartner = await this.prisma.partner.findUnique({
      where: { id },
      select: { apiKey: true },
    });

    const updated = await this.prisma.partner.update({
      where: { id },
      data: {
        isActive: dto.isActive,
        maxCoinsPerTxn: dto.maxCoinsPerTxn,
        description: dto.description,
      },
    });

    // Invalidate old partner cache
    if (oldPartner?.apiKey) {
      await this.cache.invalidatePartnerCache(oldPartner.apiKey);
    }

    return updated;
  }

  @Post(':id/regenerate-key')
  @ApiOperation({ summary: 'Regenerate partner API key (admin only)' })
  @ApiResponse({ status: 200 })
  async regenerateApiKey(@Param('id') id: string) {
    // Get old API key before regenerating
    const oldPartner = await this.prisma.partner.findUnique({
      where: { id },
      select: { apiKey: true },
    });

    const apiKey = crypto.randomBytes(32).toString('hex');

    const updated = await this.prisma.partner.update({
      where: { id },
      data: { apiKey },
      select: {
        id: true,
        name: true,
        apiKey: true,
      },
    });

    // Invalidate old API key cache
    if (oldPartner?.apiKey) {
      await this.cache.invalidatePartnerCache(oldPartner.apiKey);
    }

    return updated;
  }
}
