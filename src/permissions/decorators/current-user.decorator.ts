import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestUser } from '../../auth/interfaces/user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
