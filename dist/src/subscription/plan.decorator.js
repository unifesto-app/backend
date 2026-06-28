"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePlan = exports.PLAN_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PLAN_KEY = 'requiredPlan';
const RequirePlan = (...plans) => (0, common_1.SetMetadata)(exports.PLAN_KEY, plans);
exports.RequirePlan = RequirePlan;
//# sourceMappingURL=plan.decorator.js.map