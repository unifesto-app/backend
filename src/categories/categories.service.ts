import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const categories = await this.prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, description: true, iconUrl: true, color: true, order: true },
    });

    // Get event counts per category (upcoming/ongoing only)
    const now = new Date();
    const counts = await this.prisma.event.groupBy({
      by: ['category'],
      where: {
        status: 'PUBLISHED',
        endDateTime: { gte: now },
      },
      _count: { id: true },
    });

    const countMap = new Map(counts.map(c => [c.category, c._count.id]));

    return categories.map(cat => ({
      ...cat,
      event_count: countMap.get(cat.name) || 0,
    }));
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
