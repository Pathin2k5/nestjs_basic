import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { error } from 'console';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //kích hoạt dto và set các ràng buộc
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, //loại bỏ các trường thừa
    transform: true, //tự động ép kiểu
    forbidNonWhitelisted: true,//chặn đứng các trường lạ

    //tùy biến lại lời nhắn từ chối để dễ dàng cho fe xử lí
    exceptionFactory: (validationErrors) => {
      //validationErrors 1 mảng đối tượng chưa thông tin những trường bị nhập sai 
      //mỗi đổi tượng error có cấu trúc như sau:
      // - property : tên trường bị lỗi
      // - constraints: một object chứa các quy tắc bị vi phạm

      console.log(validationErrors);
      return new UnprocessableEntityException(// dùng để trả về lỗi 422 có nghĩa là "chưa đúng logic nghiệp vụ"
        validationErrors.map((error) => ({
          field: error.property,
          error: Object.values(error.constraints as any).join('')//lấy ra dữ liệu của 1 obj rồi nối nó lại
        })
        )
      );
    }
  }))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
