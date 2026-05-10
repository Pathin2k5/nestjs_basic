
---

#  NestJS Interceptors

## 1. Khái niệm cơ bản

* **Định nghĩa:** Là một class được đánh dấu bằng decorator `@Injectable()` và implements interface `NestInterceptor`.
* **Cảm hứng:** Dựa trên kỹ thuật Aspect Oriented Programming (AOP - Lập trình hướng khía cạnh).
* **Khả năng (Sức mạnh của Interceptor):**
* Thêm logic **trước / sau** khi thực thi method.
* **Biến đổi (Transform)** kết quả trả về từ function.
* **Biến đổi ngoại lệ (Exception)** được ném ra từ function.
* Mở rộng hành vi cơ bản của function.
* **Ghi đè hoàn toàn** function trong những điều kiện nhất định (VD: dùng để làm Caching).



## 2. Cấu trúc cốt lõi

Mỗi Interceptor phải implement hàm `intercept()` nhận vào 2 tham số:

1. **`ExecutionContext`**: Kế thừa từ `ArgumentsHost`, chứa các thông tin chi tiết về quá trình thực thi hiện tại (request, response, handler hiện tại...).
2. **`CallHandler`**: Interface chứa hàm `handle()`.
* Hàm `handle()` dùng để **kích hoạt route handler**.
* Nếu **không gọi** `handle()`, route handler (logic chính của API) sẽ **không bao giờ được chạy**.
* `handle()` trả về một **RxJS Observable**, cho phép sử dụng các toán tử mạnh mẽ của RxJS để thao tác với luồng phản hồi (response stream).



## 3. Các Use-cases thực tế (Đi kèm RxJS)

### A. Aspect Interception (Log, đo lường thời gian)

Thực thi logic trước khi xử lý và sau khi nhận kết quả.

* **Toán tử RxJS:** `tap()` - Chạy logic ẩn danh mà không làm thay đổi luồng dữ liệu chính.
* **Mô hình:** `Trước logic` -> `next.handle()` -> `pipe(tap(Sau logic))`

### B. Response Mapping (Biến đổi dữ liệu trả về)

Biến đổi dữ liệu trước khi trả về cho client (VD: bọc dữ liệu trong object `{ data: ... }` hoặc ép kiểu `null` thành `''`).

* **Toán tử RxJS:** `map()`
* *Lưu ý:* Không hoạt động nếu dùng chiến lược response cụ thể của thư viện (như dùng trực tiếp `@Res()`).

```typescript
return next.handle().pipe(map(data => ({ data })));

```

### C. Exception Mapping (Biến đổi lỗi)

Bắt và ghi đè các Exception bị ném ra.

* **Toán tử RxJS:** `catchError()`

```typescript
return next.handle().pipe(
  catchError(err => throwError(() => new BadGatewayException()))
);

```

### D. Stream Overriding (Ghi đè luồng - VD: Caching)

Ngăn không cho gọi route handler và trả về một giá trị khác ngay lập tức.

* **Cách làm:** Không gọi `next.handle()` mà trả về một stream mới (VD: dùng `of()` của RxJS).

```typescript
if (isCached) {
  return of(cachedData); // Trả luôn data cache, bỏ qua route handler
}
return next.handle();

```

### E. Xử lý Timeout (More operators)

Hủy xử lý request nếu vượt quá một khoảng thời gian chờ và ném ra lỗi Timeout.

* **Toán tử RxJS:** `timeout()`, `catchError()`

```typescript
return next.handle().pipe(
  timeout(5000), // Timeout sau 5s
  catchError(err => {
    if (err instanceof TimeoutError) {
      return throwError(() => new RequestTimeoutException());
    }
    return throwError(() => err);
  }),
);

```

## 4. Cách gắn (Binding) Interceptors

Sử dụng decorator `@UseInterceptors()`:

* **Method-scoped:** Gắn ngay trên method của controller.
* **Controller-scoped:** Gắn trên đầu class controller (áp dụng cho mọi route trong controller).
```typescript
@UseInterceptors(LoggingInterceptor) // Có thể truyền class hoặc instance (new LoggingInterceptor())
export class CatsController {}

```


* **Global-scoped:** Áp dụng toàn app.
* *Cách 1 (Ở main.ts):* `app.useGlobalInterceptors(new LoggingInterceptor());` (Không dùng được Dependency Injection).
* *Cách 2 (Ở app.module.ts):* Dùng Custom Provider để hỗ trợ DI.


```typescript
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  },
]

```