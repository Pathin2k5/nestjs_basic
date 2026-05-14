import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Decorator Custom: Dùng để so sánh giá trị của trường hiện tại với một trường khác trong cùng một Object.
 * param property Tên của trường (field) mà bạn muốn so sánh đối chiếu (ví dụ: 'password').
 * param validationOptions Các tùy chọn thông báo lỗi hoặc điều kiện validation bổ sung.
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  // Trả về một hàm decorator cho class property
  return function (object: Object, propertyName: string) {
    // Đăng ký quy tắc validation mới vào hệ thống class-validator
    registerDecorator({
      name: 'match',              // Tên của validator (có thể dùng để định danh sau này)
      target: object.constructor, // Class chứa thuộc tính đang được validate
      propertyName: propertyName, // Tên của trường đang gắn decorator này (ví dụ: 'confirmPassword')
      constraints: [property],    // Lưu trữ tên trường cần đối chiếu vào mảng constraints (tham số phụ)
      options: validationOptions, // Các tùy chọn như { message: '...' }
      validator: {
        /**
         * Hàm validate thực thi logic kiểm tra
         * param value Giá trị của trường hiện tại (ví dụ: giá trị của 'confirmPassword')
         * param args Các tham số ngữ cảnh của quá trình validation
         */
        validate(value: any, args: ValidationArguments) {
          // Lấy tên trường cần đối chiếu từ mảng constraints đã khai báo bên trên
          const [relatedPropertyName] = args.constraints;

          // Truy cập vào Object tổng và lấy ra giá trị của trường cần đối chiếu
          // args.object đại diện cho toàn bộ instance của class (ví dụ: instance của RegisterDto)
          const relatedValue = (args.object as any)[relatedPropertyName];

          // So sánh bằng (strict equality)
          // Nếu khớp trả về true (hợp lệ), nếu khác trả về false (báo lỗi)
          return value === relatedValue;
        },

        /**
         * (Tùy chọn) Hàm định nghĩa thông báo lỗi mặc định nếu không được truyền từ bên ngoài
         */
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must match ${args.constraints[0]}`;
        }
      },
    });
  };
}