import { plainToInstance } from "class-transformer";
import { IsString, validateSync } from "class-validator";
import { config } from "dotenv";
import fs from 'fs';
import path from 'path';

config({
    path: '.env',
});

//check xem file .env có hay chưa

if(!fs.existsSync(path.resolve('.env'))){
    console.log("Không tìm thấy  file .env");
    process.exit(1);
}
//tạo ra 1 class để định nghĩa 1 khuôn mẫu cho các biến ở env
class ConfigSchema{
    @IsString()
    DATABASE_URL: string;
    @IsString()
    ACCESS_TOKEN_SECRET: string;
    @IsString()
    ACCESS_TOKEN_EXPIRES_IN: string;
    @IsString()
    REFRESH_TOKEN_SECRET: string;
    @IsString()
    REFRESH_TOKEN_EXPIRES_IN: string;
}

//Biến môi trường (process.env) bản chất chỉ là một Object đơn thuần (Plain Object).
//Hàm này sẽ "đúc" Object đó vào Class ConfigSchema để nó trở thành một đối tượng thực thụ (Instance).
const configServer = plainToInstance(ConfigSchema,process.env,{
    enableImplicitConversion : true,
    //Tự động chuyển đổi kiểu dữ liệu nếu cần
});


const errorArray = validateSync(configServer);
//nó trả về 1 mảng
//Kiểm tra toàn bộ các biến trong configServer dựa trên các decorator

if(errorArray.length >0 ){
    console.log('Các giá trị khai báo trong file .env không hợp lệ');
    const errors = errorArray.map((eItem)=>{
        return{
            property: eItem.property,//lấy ra tên biến lỗi

            constraints: eItem.constraints,//lỗi cụ thể là gì
            value: eItem.value,//giá trị hiện tại bị lỗi 
        }
    });
    throw errors;
}

const envConfig = configServer;
export default envConfig;