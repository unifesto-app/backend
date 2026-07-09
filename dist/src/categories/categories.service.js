"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll() {
        const categories = await this.prisma.eventCategory.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, slug: true, description: true, iconUrl: true, color: true, order: true },
        });
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
    async create(data) {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const maxOrder = await this.prisma.eventCategory.aggregate({ _max: { order: true } });
        return this.prisma.eventCategory.create({
            data: { ...data, slug, order: (maxOrder._max.order || 0) + 1 },
        });
    }
    async update(id, data) {
        if (data.name)
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return this.prisma.eventCategory.update({ where: { id }, data });
    }
    async delete(id) {
        return this.prisma.eventCategory.update({ where: { id }, data: { isActive: false } });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map