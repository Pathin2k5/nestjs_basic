import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HasingService } from 'src/shared/hasing.service';
import { PrismaService } from 'src/shared/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { TokenService } from 'src/shared/token.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly hasingService : HasingService,
        private readonly prismaService : PrismaService,
        private readonly tokenService : TokenService
    ){}
    async register(body:RegisterDto){
        try {
            const hashedPassword = await this.hasingService.hashPassword(body.password);
            const user = await this.prismaService.user.create({
                data : {
                    email : body.email,
                    password : hashedPassword,
                    name : body.name
                }
            })
            return user;
        } catch (error) {
            if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"){
                throw new ConflictException("Email already exists")
            }
            throw error;
        }


    }
    async login(body : LoginDto){
        //xem user đó có tồn tại ko
        const user = await this.prismaService.user.findUnique({
            where:{
                email : body.email
            }
        })
        if(!user){
            throw new UnauthorizedException('Account is not exist');
            //mã lỗi UnauthorizedException sẽ là 401 mang ý nghĩa là tôi ko biết bạn là ai
        }
        //so sánh password người dùng gửi lên có đúng ko
        const isPasswordMatch = await this.hasingService.comparePasswords(body.password,user.password);
        if(!isPasswordMatch){
            throw new UnprocessableEntityException("Password is incorrect");
            //mã lỗi UnprocessableEntityException là 422 mang nghĩa là định dạng gửi lên ko đúng

        }
        const tokens = await this.generateTokens({userId : user.id});
        return tokens;
        
    }

    async generateTokens(payload : {userId:number}){
        const accesstoken = await this.tokenService.signAccessToken(payload);
        const refreshToken = await this.tokenService.signRefreshToken(payload);
        const decodeRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken); //để lấy ra thời gian hết hạn từ payload của refresh token thông qua exp
        await this.prismaService.refreshToken.create({
            data : {
                token: refreshToken,
                userId : payload.userId,
                expiresAt : new Date(decodeRefreshToken.exp *1000), // đổ từ số giây sang lưu ở dạng date
            }
        })
        return {accesstoken,refreshToken}
    }
}
