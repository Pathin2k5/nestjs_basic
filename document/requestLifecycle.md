

---

# NestJS Request Lifecycle

## 1. Tổng quan luồng đi (General Flow)

Khi một request đi tới server NestJS, nó sẽ di chuyển qua các thành phần theo thứ tự sau:

1. **Incoming Request**
2. **Middleware**
3. **Guards**
4. **Interceptors (Pre-controller)**
5. **Pipes**
6. **Controller (Method Handler)**
7. **Service** (Xử lý logic nghiệp vụ)
8. **Interceptors (Post-request)**
9. **Exception Filters** (Nếu có lỗi xảy ra)
10. **Server Response**

---

## 2. Chi tiết thứ tự thực thi từng thành phần

###  Middleware

Thực thi theo cơ chế tuần tự (sequential) tương tự Express.

* **Thứ tự:** Global Bound Middleware → Module Bound Middleware.
* **Lưu ý:** Middleware gắn ở Root Module sẽ chạy trước, sau đó đến các module khác theo thứ tự khai báo trong mảng `imports`.

### Guards

Kiểm tra quyền truy cập. Chạy theo thứ tự từ ngoài vào trong.

* **Thứ tự:** Global Guards → Controller Guards → Route Guards.
* **Quy tắc:** Thực thi theo thứ tự được ràng buộc (ví dụ: `@UseGuards(Guard1, Guard2)` thì 1 chạy trước 2).

###  Interceptors (Vòng lặp hai chiều)

Interceptors rất đặc biệt vì nó xử lý cả lúc Request đi vào và Response đi ra nhờ RxJS Observables.

* **Chiều đi (Inbound):** Global → Controller → Route.
* **Chiều về (Outbound):** Route → Controller → Global (Cơ chế **FILO** - First In, Last Out).
* **Đặc điểm:** Có thể bắt được lỗi từ Pipes, Controllers, Services thông qua toán tử `catchError`.

### Pipes

Dùng để biến đổi dữ liệu (Transformation) hoặc xác thực (Validation).

* **Thứ tự:** Global Pipes → Controller Pipes → Route Pipes → Route Parameter Pipes.
* **Quy tắc tham số:** Nếu một route có nhiều pipe cho các tham số (`@Body`, `@Query`,...), các pipe sẽ chạy từ **tham số cuối cùng đến tham số đầu tiên**.

### Exception Filters

Thành phần duy nhất **KHÔNG** ưu tiên Global trước.

* **Thứ tự:** Route → Controller → Global (Từ thấp lên cao).
* **Lưu ý:** * Chỉ thực thi khi có ngoại lệ (exception) chưa được bắt (`uncaught`).
* Nếu lỗi đã được bắt bởi Filter ở cấp Route, nó sẽ không "nổi" lên cấp Controller hay Global nữa.



---

## 3. Bảng tóm tắt nhanh thứ tự (Cheat Sheet)

| Thành phần | Thứ tự ưu tiên | Đặc điểm cần nhớ |
| --- | --- | --- |
| **Middleware** | Global -> Module | Chạy đầu tiên, giống Express. |
| **Guards** | Global -> Controller -> Route | Quyết định request có được đi tiếp hay không. |
| **Interceptors** | Global -> Controller -> Route | Xử lý logic trước và sau khi vào Controller. |
| **Pipes** | Global -> Controller -> Route -> Param | Tham số chạy từ phải sang trái (Last to First). |
| **Filters** | Route -> Controller -> Global | **Ngược lại với tất cả**: Chạy từ Local lên Global. |

---

## 4. Minh họa bằng ví dụ thực tế

Giả sử bạn có một logic cập nhật thông tin:
`PATCH /cats/:id`

1. **Middleware:** Kiểm tra xem request có đúng định dạng header không.
2. **Guards:** Kiểm tra User đã đăng nhập (AuthGuard) và có quyền Admin không (RolesGuard).
3. **Interceptors (Pre):** Log thời gian bắt đầu nhận request.
4. **Pipes:** * `ParseIntPipe` chuyển `id` từ string sang number.
* `ValidationPipe` kiểm tra `body` có đủ các trường yêu cầu không.


5. **Controller:** Gọi service để update DB.
6. **Interceptors (Post):** Format lại dữ liệu trả về cho client (ví dụ: bọc trong object `{ data: ... }`).
7. **Filters:** Nếu DB báo lỗi (ví dụ: trùng tên), Filter sẽ bắt lỗi này và trả về mã lỗi 400 thay vì 500.

---
