import { Exclude } from "class-transformer";
import { IsString } from "class-validator";

export class LoginDto {
    @IsString()
    email: string;
    @IsString()
    password: string;

}

export class RegisterDto extends LoginDto {
    @IsString()
    name: string;
    @IsString()
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