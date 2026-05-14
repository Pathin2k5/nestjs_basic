
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import envConfig from '../config';


@Injectable()
export class ApiKeyGuard implements CanActivate {
    //guard kiểm tra x-api-key có chính xác ko
    canActivate(
        context: ExecutionContext,
    ): boolean {
        const request = context.switchToHttp().getRequest();//lấy ra request 
        const xApiKey = request.headers['x-api-key'];
        if(xApiKey !== envConfig.SECRET_API_KEY){
            throw new UnauthorizedException()
        }
        return true;
    }
}
