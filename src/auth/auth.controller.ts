import { Body, ClassSerializerInterceptor, Controller, Post, SerializeOptions, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResDto, RefreshTokenBodyDto, RegisterDto, RegisterResDTO } from './auth.dto';
import { LoggingInterceptor } from 'src/shared/Interceptors/logging.interceptor';
import { GuardsConsumer } from '@nestjs/core/guards';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guards';
import { ApiKeyGuard } from 'src/shared/guards/api-key-guards';


//sử dụng interceptor logg trong phạm vi của controller này
// @UseInterceptors(new LoggingInterceptor())

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){   
    }
    /**
     * Luồng xử lý: 
     * 1. ClassSerializerInterceptor: Kích hoạt bộ lọc dữ liệu trả về.
     * 2. SerializeOptions: Chỉ định dùng khuôn 'RegisterResDTO' để lọc.
     * => Mục đích: Ẩn các thông tin nhạy cảm (như password) hoặc format lại dữ liệu theo đúng chuẩn của DTO phản hồi.
     */
    @UseInterceptors(ClassSerializerInterceptor)
    @SerializeOptions({ type: RegisterResDTO })

    @Post('register')
    register(@Body() body:RegisterDto){
        // console.log("Controller......");
        return this.authService.register(body);
    }

    @SerializeOptions({type:LoginResDto})
    @Post('login')
    async login(@Body() body:LoginDto){
        return await this.authService.login(body);
    }

    @UseGuards(ApiKeyGuard,AccessTokenGuard)//quards để kiểm soát controller này
    //Chạy ApiKeyGuard trước, sau đó mới đến AccessTokenGuard
    @SerializeOptions({type:RegisterResDTO})
    @Post('refresh')
    async refreshToken(@Body() body:RefreshTokenBodyDto){
        return await this.authService.refreshToken(body.refreshToken);
    }
}
