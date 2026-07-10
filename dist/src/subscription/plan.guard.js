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
exports.PlanGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const plan_decorator_1 = require("./plan.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let PlanGuard = class PlanGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredPlans = this.reflector.getAllAndOverride(plan_decorator_1.PLAN_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPlans) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const subscription = await this.prisma.orgSubscription.findUnique({
            where: { userId },
        });
        if (!subscription || !subscription.isActive) {
            throw new common_1.ForbiddenException('No active subscription');
        }
        if (!requiredPlans.includes(subscription.plan)) {
            throw new common_1.ForbiddenException(`This feature requires one of these plans: ${requiredPlans.join(', ')}`);
        }
        return true;
    }
};
exports.PlanGuard = PlanGuard;
exports.PlanGuard = PlanGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PlanGuard);
//# sourceMappingURL=plan.guard.js.map