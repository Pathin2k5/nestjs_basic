import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import envConfig from './config';
import { TokenPayload } from './types/jwt.type';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService
    ) { }

    //dùng để tạo ra Access Token 
    signAccessToken(payload: { userId: number }) {
        return this.jwtService.sign(payload, {
            secret: envConfig.ACCESS_TOKEN_SECRET,
            expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as any,
            algorithm: 'HS256'
        });
    }
    //dùng để tạo ra refreshToken 
    signRefreshToken(payload: { userId: number }) {
        return this.jwtService.sign(payload, {
            secret: envConfig.REFRESH_TOKEN_SECRET,
            expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as any,
            algorithm: 'HS256'
     
        });
    }
    //kiểm ra tính hợp lệ của access token
    verifyAccessToken(token: string): Promise<TokenPayload> {
        return this.jwtService.verifyAsync(token, {
            secret: envConfig.ACCESS_TOKEN_SECRET
        })
    }
    //kiểm tra tính hợp lệ của refresh token
    verifyRefreshToken(token: string):Promise<TokenPayload>{
        return this.jwtService.verifyAsync(token, {
            secret: envConfig.REFRESH_TOKEN_SECRET
        })
    }

}
