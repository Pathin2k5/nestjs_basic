
---

# Serialization (Tuần tự hóa dữ liệu) trong NestJS

### 1. Serialization là gì?

Hãy tưởng tượng bạn lấy dữ liệu User từ Database, trong đó có cả trường `password`, `salt`, hoặc `createdAt`. Bạn **không muốn** trả mật khẩu về cho Client.
**Serialization** là quá trình tự động "lọc" hoặc "biến đổi" đối tượng dữ liệu trước khi nó được gửi qua mạng đến Client.

### 2. Công cụ hỗ trợ

NestJS sử dụng bộ đôi hoàn hảo:

* **`ClassSerializerInterceptor`**: Một "người gác cổng" chặn dữ liệu đầu ra để xử lý.
* **`class-transformer`**: Thư viện cung cấp các Decorator để đánh dấu quy tắc lọc dữ liệu.

### 3. Cách triển khai cơ bản

#### Bước 1: Khai báo Entity/DTO với các quy tắc

Bạn sử dụng các Decorator của `class-transformer` để đánh dấu:

```typescript
import { Exclude, Expose, Transform } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude() // Sẽ KHÔNG được trả về client
  password: string;

  @Expose() //  Tạo một trường ảo (Computed property)
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Transform(({ value }) => value.toUpperCase()) //  Biến đổi dữ liệu
  username: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

```

#### Bước 2: Kích hoạt Interceptor trong Controller

Để các Decorator trên có tác dụng, bạn phải dùng `@UseInterceptors`.

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({
    id: 1,
    firstName: 'John',
    password: 'secret_password', // Sẽ bị tự động xóa khi trả về
  });
}

```

---

### 4. Các Decorator quan trọng cần nhớ

| Decorator | Ý nghĩa |
| --- | --- |
| **`@Exclude()`** | Loại bỏ hoàn toàn trường này khỏi kết quả trả về. |
| **`@Expose()`** | Đảm bảo trường này được hiển thị (thường dùng cho getter hoặc đổi tên trường). |
| **`@Transform()`** | Cho phép viết logic để thay đổi giá trị (VD: format ngày tháng, viết hoa...). |

---

### 5. Lưu ý "Sống còn" (Warning)

**Lỗi thường gặp nhất:** Trả về Object thuần `{}` thay vì Instance của Class.

*  **Sai:** `return { id: 1, password: '...' };` (Interceptor sẽ không hoạt động vì nó không biết đây là `UserEntity`).
*  **Đúng:** `return new UserEntity({ ... });` (Phải khởi tạo class).

**Mẹo (Hint):** Nếu bạn lười `new UserEntity(...)` ở mọi nơi, hãy dùng:

```typescript
@SerializeOptions({ type: UserEntity }) // Ép kiểu dữ liệu trả về là UserEntity

```

Khi đó, dù bạn trả về object thường, NestJS vẫn tự hiểu và áp dụng các quy tắc lọc của `UserEntity`.

### 6. Cấu hình Toàn cục (Global)

Thay vì gắn `@UseInterceptors` lên từng Controller, bạn có thể cấu hình ở `main.ts` để áp dụng cho cả dự án:

```typescript
// main.ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

```

---

### Tư duy giữa DTO và Serialization:

1. **Request đi vào:** Dùng **DTO** để Validate (chặn dữ liệu xấu vào).
2. **Response đi ra:** Dùng **Serialization** để lọc dữ liệu nhạy cảm (không để lộ mật khẩu).
