import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, description: true, iconUrl: true, color: true, order: true },
    });
  }

  async create(data: { name: string; description?: string; color?: string; iconUrl?: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const maxOrder = await this.prisma.eventCategory.aggregate({ _max: { order: true } });
    return this.prisma.eventCategory.create({
      data: { ...data, slug, order: (maxOrder._max.order || 0) + 1 },
    });
  }

  async update(id: string, data: any) {
    if (data.name) data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.prisma.eventCategory.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.eventCategory.update({ where: { id }, data: { isActive: false } });
  }
}
