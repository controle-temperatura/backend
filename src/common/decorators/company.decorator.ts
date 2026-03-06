import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Company = createParamDecorator(
    (_, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user?.companyId;
    },
);
