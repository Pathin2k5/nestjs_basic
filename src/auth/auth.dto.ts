import { Exclude } from "class-transformer";
import { IsString, Length } from "class-validator";
import { Match } from "src/shared/decorator/custom-validator";

export class LoginDto {
    @IsString()
    email: string;
    @IsString()
    @Length(6,20,{message : "Mật khẩu phải từ 6 đến 20 kí tự"})
    password: string;

}

export class RegisterDto extends LoginDto {
    @IsString()
    name: string;
    @IsString()
    @Match('password',{message: "mật khẩu ko khớp"})
    confirmPassword: string;
}

export class LoginResDto {
    @IsString()
    accesstoken : string;
    @IsString()
    refreshToken : string;
    constructor(partial: Partial<LoginResDto>) {
        Object.assign(this, partial);
    }
}
export class RegisterResDTO {
    id: number;
    email: string;
    name: string;
    @Exclude() // trường này ko được xuất hiện trong kết quả trả về
    password: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<RegisterResDTO>) {
        Object.assign(this, partial);
    }
}

export class RefreshTokenBodyDto{
    @IsString()
    refreshToken : string;

}

export class RefreshTokenResDto extends LoginResDto {

}

export class LogoutBodyDto extends RefreshTokenBodyDto{}

export class LogoutResDto {
    message : string;
    
    constructor(partial: Partial<LogoutBodyDto>) {
        Object.assign(this, partial);
    }

}