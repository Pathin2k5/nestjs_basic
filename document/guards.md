## Guard Nestjs

Hãy tưởng tượng Guard như một **người bảo vệ (bảo vệ cổng)** đứng trước các căn phòng (route handlers). Trước khi cho phép ai đó bước vào phòng, người bảo vệ này sẽ kiểm tra xem họ có đủ "thẻ bài" (quyền hạn, role) hay không.

Dưới đây là bài giảng chi tiết dành cho bạn:

---

## 1. Guard là gì và Trách nhiệm duy nhất

Guard là một class có gắn decorator `@Injectable()` và phải triển khai (implement) interface `CanActivate`.

**Trách nhiệm duy nhất:** Xác định xem một request có được phép xử lý bởi route handler hay không.

* **Nếu trả về `true`:** Mời vào, request được tiếp tục.
* **Nếu trả về `false`:** Chặn lại, NestJS sẽ tự động ném ra lỗi `403 Forbidden`.

### Tại sao dùng Guard thay vì Middleware?

Mặc dù Middleware cũng có thể chặn request, nhưng Middleware rất "ngây thơ" (dumb). Nó không biết sau khi nó gọi `next()`, hàm nào sẽ được thực thi.

* **Guard** thì khác: Nó có quyền truy cập vào `ExecutionContext`. Nhờ đó, nó biết chính xác controller nào, method nào sắp được chạy và các metadata (thông tin đính kèm) của route đó là gì.

---

## 2. Cách hoạt động của hàm `canActivate()`

Mọi Guard bắt buộc phải có hàm này. Nó nhận vào một đối tượng là `ExecutionContext`.

```typescript
canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
  const request = context.switchToHttp().getRequest(); // Lấy thông tin request
  return validateRequest(request); // Logic kiểm tra của bạn
}

```

* **ExecutionContext:** Giúp bạn lấy được thông tin của request hiện tại (trong HTTP context là `Request` object).

---

## 3. Phạm vi sử dụng (Binding Guards)

Bạn có thể đặt "bảo vệ" ở 3 cấp độ:

1. **Method-scoped:** Chỉ bảo vệ 1 hàm cụ thể.
2. **Controller-scoped:** Bảo vệ toàn bộ các route trong 1 Controller.
```typescript
@UseGuards(RolesGuard)
export class CatsController {}

```


3. **Global-scoped:** Bảo vệ toàn bộ ứng dụng.
* Cách 1: Dùng `app.useGlobalGuards(new RolesGuard())` trong `main.ts`.
* Cách 2: Khai báo trong `AppModule` để có thể sử dụng Dependency Injection (khuyên dùng).



---

## 4. Case Study: Phân quyền dựa trên vai trò (RBAC)

Đây là phần "thông minh" nhất của Guard khi kết hợp với **Metadata**.

### Bước 1: Tạo Decorator để đánh dấu quyền

Chúng ta dùng `Reflector` để tạo ra một cái "nhãn" đặt lên các route.

```typescript
// roles.decorator.ts
export const Roles = Reflector.createDecorator<string[]>();

```

### Bước 2: Gắn nhãn lên Route

```typescript
@Post()
@Roles(['admin']) // Chỉ admin mới được tạo cat
async create(@Body() createCatDto: CreateCatDto) { ... }

```

### Bước 3: Guard đọc nhãn và kiểm tra

Guard sẽ dùng `Reflector` để soi xem cái route sắp chạy có yêu cầu "nhãn" (role) gì không, sau đó so sánh với role của user đang gửi request.

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy role yêu cầu từ metadata của method
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) return true; // Nếu route không yêu cầu role, cho qua.

    // 2. Lấy thông tin user từ request (thường do Auth middleware/guard trước đó gắn vào)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 3. Kiểm tra xem user có đủ quyền không
    return roles.some(role => user.roles?.includes(role));
  }
}

```

---

## 5. Những lưu ý quan trọng cần nhớ

* **Thứ tự thực thi:** Middleware -> **Guards** -> Interceptors -> Pipes.
* **Lỗi mặc định:** Nếu Guard trả về `false`, user nhận lỗi `403 Forbidden`. Nếu bạn muốn lỗi khác (như `401 Unauthorized`), bạn phải chủ động `throw new UnauthorizedException()`.
* **Tính kế thừa:** `ExecutionContext` kế thừa từ `ArgumentsHost`, nên nó rất mạnh mẽ, làm việc được với cả HTTP, WebSockets và Microservices.

---

**Tóm lại:** Hãy dùng Guard khi bạn cần xử lý logic liên quan đến **Authorization** (ủy quyền) vì nó hiểu rõ ngữ cảnh thực thi của ứng dụng hơn bất kỳ thành phần nào khác.
