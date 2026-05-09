
---

# DTO (Data Transfer Object) trong NestJS

### 1. Định nghĩa

DTO là một đối tượng dùng để định nghĩa cấu trúc dữ liệu được gửi trong một request (từ Client lên Server). Nó đóng vai trò như một "hợp đồng" dữ liệu giữa hai bên.

### 2. Tại sao nên dùng Class thay vì Interface?

* **Interface:** Chỉ tồn tại trong quá trình code (TypeScript), khi compile sang JavaScript sẽ bị xóa mất. Không thể dùng để validation lúc ứng dụng đang chạy (runtime).
* **Class:** Tồn tại cả khi đã compile sang JavaScript. Cho phép sử dụng các **Decorators** từ thư viện `class-validator` để kiểm tra dữ liệu trực tiếp.

### 3. Các bước triển khai chuẩn

#### Bước A: Cài đặt thư viện hỗ trợ

```bash
npm i class-validator class-transformer

```

#### Bước B: Kích hoạt Validation toàn cục (tại `main.ts`)

Để NestJS tự động kiểm tra DTO, bạn phải thêm `ValidationPipe`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,               // Loại bỏ các trường thừa không có trong DTO
  forbidNonWhitelisted: true,    // Báo lỗi nếu gửi lên trường lạ
  transform: true,               // Tự động ép kiểu (VD: string sang number)
}));

```

#### Bước C: Định nghĩa DTO (Ví dụ cho chức năng Auth)

Tạo file: `src/auth/dto/register.dto.ts`

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự' })
  password: string;
}

```

#### Bước D: Sử dụng trong Controller

```typescript
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}

```

### 4. Lợi ích tóm tắt

1. **Security:** Chặn đứng dữ liệu rác, mã độc ngay tại "cửa ngõ" Controller.
2. **Validation:** Tự động trả về lỗi 400 Bad Request kèm thông báo chi tiết mà không cần viết `if/else` thủ công.
3. **Type Safety:** Gợi ý code (IntelliSense) cực tốt khi viết logic trong Service.
4. **Documentation:** Giúp Swagger (nếu có dùng) tự động tạo tài liệu API chính xác.

---
