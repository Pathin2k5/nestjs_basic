
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../token.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(private readonly tokenService: TokenService) { }
    //canActivate hàm quyết định xem request có được tiếp tục hay ko 
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();//lấy ra request 
        const accessToken = request.headers.authorization?.split(' ')[1];//lấy ra access token
        if (!accessToken) {
            throw new UnauthorizedException();//mã code 401 từ chối yêu cầu từ client gửi lên
        }
        try {
            const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken);//kiểm tra xem cái accesstoken còn hạn ko
            request.user = decodedAccessToken;
            //tạo ra 1 trường user mới tại obj request lưu trữ payload của accesstoken để cho controller sau đó dễ dang xử lí
            return true;
        } catch (error) {
            throw new UnauthorizedException();
    
        }
    }
}
