import { Body, ClassSerializerInterceptor, Controller, Post, SerializeOptions, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResDto, RegisterDto, RegisterResDTO } from './auth.dto';
import { LoggingInterceptor } from 'src/shared/Interceptors/logging.interceptor';


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
}
