# Prisma CLI Commands Cheat Sheet

Tài liệu này tổng hợp các câu lệnh CLI hay dùng khi làm việc với Prisma.

---

## 1. Khởi tạo Prisma

```bash
npx prisma init
```

* Tạo thư mục `prisma/` và file `schema.prisma`
* Tạo file `.env`

---

## 2. Làm việc với Database

### Tạo migration và cập nhật DB

```bash
npx prisma migrate dev --name init
```

* Tạo migration mới
* Áp dụng migration vào database

### Deploy migration (production)

```bash
npx prisma migrate deploy
```

### Reset database

```bash
npx prisma migrate reset
```

* Xóa toàn bộ dữ liệu
* Chạy lại tất cả migration

---

## 3. Generate Prisma Client

```bash
npx prisma generate
```

* Tạo Prisma Client từ schema

---

## 4. Pull schema từ database

```bash
npx prisma db pull
```

* Đồng bộ schema từ database về `schema.prisma`

---

## 5. Push schema lên database (không migration)

```bash
npx prisma db push
```

* Cập nhật database theo schema
* Không tạo migration

---

## 6. Mở Prisma Studio (GUI)

```bash
npx prisma studio
```

* Giao diện web để xem và chỉnh sửa dữ liệu

---

## 7. Validate schema

```bash
npx prisma validate
```

* Kiểm tra lỗi trong schema

---

## 8. Format schema

```bash
npx prisma format
```

* Format lại file `schema.prisma`

---

## 9. Xem thông tin database

```bash
npx prisma db pull --print
```

* In schema ra terminal

---

## 10. Seed database

```bash
npx prisma db seed
```

* Chạy file seed (cần config trong package.json)

---

## 11. Introspect database (cũ)

```bash
npx prisma introspect
```

* Tương tự `db pull` (deprecated)

---

## 12. Debug & Logs

```bash
DEBUG="prisma:*" node index.js
```

* Bật log debug Prisma

---

## 13. Version Prisma

```bash
npx prisma -v
```

---

## Gợi ý workflow cơ bản

```bash
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio
```

---

## Ghi chú

* Luôn chạy `prisma generate` sau khi sửa schema
* Dùng `migrate dev` khi development
* Dùng `migrate deploy` khi production
