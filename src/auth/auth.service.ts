import { ConflictException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HasingService } from 'src/shared/hasing.service';
import { PrismaService } from 'src/shared/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { TokenService } from 'src/shared/token.service';
import { Unzip } from 'zlib';
import { isNotFoundError, isUniqueContraintError } from 'src/shared/helpers';

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
            if(isUniqueContraintError(error)){
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

    async refreshToken(refreshToken:string){
        try {
            //1. kiểm tra cái refreshToken client gửi lên xem có hợp lệ hay ko
           const  {userId} = await this.tokenService.verifyRefreshToken(refreshToken);
           //2. check xem cai refreshToken có tồn tại trong database ko
           await this.prismaService.refreshToken.findUniqueOrThrow({
            where : {
                token : refreshToken
            }
           })
           //3. xóa refreshToken cũ đi
           await this.prismaService.refreshToken.delete({
            where :{
                token : refreshToken
            }
           })
           return await this.generateTokens({userId});//trả về access token và refresh token
        } catch (error) {
            //trường hợp refresh token rồi ,hãy thông báo cho user biết
            // refresh token của họ đã bị đánh cắp
            if(isNotFoundError(error)){
                throw new UnauthorizedException('Refresh token has been revoked')
            }
            throw new UnauthorizedException('Refresh token is invalid');
        }
    }
}
