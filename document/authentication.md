# 🔐 JWT Authentication — Lý Thuyết & Thực Hành với NestJS + Prisma

> Tác giả: Backend Developer Guide  
> Stack: **NestJS** · **Prisma ORM** · **PostgreSQL** · **JWT**

---

## Mục Lục

1. [Lý Thuyết Authentication](#1-lý-thuyết-authentication)
2. [JWT là gì?](#2-jwt-là-gì)
3. [Access Token vs Refresh Token](#3-access-token-vs-refresh-token)
4. [Luồng hoạt động](#4-luồng-hoạt-động)
5. [Khởi tạo dự án NestJS](#5-khởi-tạo-dự-án-nestjs)
6. [Cài đặt & cấu hình Prisma](#6-cài-đặt--cấu-hình-prisma)
7. [Tạo Auth Module](#7-tạo-auth-module)
8. [Implement Register & Login](#8-implement-register--login)
9. [JWT Strategy với Passport](#9-jwt-strategy-với-passport)
10. [Guard & bảo vệ Route](#10-guard--bảo-vệ-route)
11. [Refresh Token](#11-refresh-token)
12. [Best Practices & Security](#12-best-practices--security)

---

## 1. Lý Thuyết Authentication

### Authentication vs Authorization

| Khái niệm | Ý nghĩa | Ví dụ |
|-----------|---------|-------|
| **Authentication (AuthN)** | Xác thực danh tính — *"Bạn là ai?"* | Đăng nhập bằng email + password |
| **Authorization (AuthZ)** | Phân quyền — *"Bạn được làm gì?"* | User chỉ xem, Admin mới được xóa |

### Các phương thức Authentication phổ biến

- **Session-based**: Server lưu session, client giữ session ID trong cookie → stateful
- **JWT (Token-based)**: Server không lưu state, client giữ token → stateless ✅
- **OAuth2 / OpenID Connect**: Đăng nhập qua bên thứ ba (Google, GitHub...)
- **API Key**: Dùng cho machine-to-machine

> Trong hướng dẫn này ta dùng **JWT** vì phù hợp với kiến trúc REST API, microservices, và mobile app.

---

## 2. JWT là gì?

**JWT (JSON Web Token)** là một chuỗi string được mã hóa, dùng để truyền thông tin giữa các bên một cách an toàn.

### Cấu trúc JWT

```
xxxxx.yyyyy.zzzzz
  │      │      │
Header  Payload  Signature
```

**Header** — Thuật toán & loại token:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** — Dữ liệu (claims):
```json
{
  "sub": "user_id_123",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1715000000, //thời điểm tạo
  "exp": 1715003600 //thời gian hết hạn
}
```

**Signature** — Chữ ký xác thực:
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```

> ⚠️ **Lưu ý quan trọng**: Payload chỉ được **encode** (base64), không phải **encrypt**. Ai cũng đọc được nội dung — KHÔNG lưu thông tin nhạy cảm như password vào payload!

### JWT hoạt động như thế nào?

```
Client                          Server
  |                               |
  |  POST /auth/login             |
  |  { email, password } ──────► |
  |                               |  Xác thực thông tin
  |                               |  Tạo JWT token
  |  ◄────── { access_token }    |
  |                               |
  |  GET /api/profile             |
  |  Authorization: Bearer <jwt> ►|
  |                               |  Verify token (không cần DB)
  |  ◄────── { user data }       |
```

---

## 3. Access Token vs Refresh Token

| | **Access Token** | **Refresh Token** |
|---|---|---|
| **Mục đích** | Truy cập API | Lấy Access Token mới |
| **Thời hạn** | Ngắn (15 phút – 1 giờ) | Dài (7 ngày – 30 ngày) |
| **Lưu ở đâu** | Memory / localStorage | HttpOnly Cookie |
| **Gửi theo request** | Authorization header | Endpoint riêng `/auth/refresh` |
| **Lưu trong DB** | Không | Có (để revoke) |

**Tại sao cần Refresh Token?**

- Access Token ngắn hạn → an toàn hơn nếu bị lộ
- Refresh Token dài hạn → người dùng không cần login lại liên tục
- Có thể thu hồi (revoke) Refresh Token trong DB khi user logout

---

## 4. Luồng hoạt động

```
┌─────────────────────────────────────────────────────┐
│                   FULL AUTH FLOW                     │
└─────────────────────────────────────────────────────┘

1. REGISTER
   Client ──► POST /auth/register { name, email, password }
           ◄── 201 { message: "Đăng ký thành công" }

2. LOGIN
   Client ──► POST /auth/login { email, password }
           ◄── 200 { access_token, refresh_token }

3. ACCESS PROTECTED ROUTE
   Client ──► GET /users/me
              Header: Authorization: Bearer <access_token>
           ◄── 200 { user data }

4. REFRESH TOKEN (khi access_token hết hạn)
   Client ──► POST /auth/refresh
              Header: Authorization: Bearer <refresh_token>
           ◄── 200 { access_token mới }

5. LOGOUT
   Client ──► POST /auth/logout
              Header: Authorization: Bearer <access_token>
           ◄── 200 { message: "Logout thành công" }
              (Server xóa refresh_token trong DB)
```

---

## 5. Khởi tạo dự án NestJS

### Cài đặt NestJS CLI và tạo project

```bash
npm i -g @nestjs/cli
nest new jwt-auth-demo
cd jwt-auth-demo
```

### Cài đặt các dependencies cần thiết

```bash
# JWT & Passport
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local

# Type definitions
npm install -D @types/passport-jwt @types/passport-local

# Bcrypt để hash password
npm install bcrypt
npm install -D @types/bcrypt

# Config module
npm install @nestjs/config

# Prisma
npm install @prisma/client
npm install -D prisma
```

### Cấu trúc thư mục

```
src/
├── auth/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── local-auth.guard.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── users.module.ts
│   └── users.service.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

### Tạo file `.env`

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/jwt_auth_db"

JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_ACCESS_EXPIRES_IN="15m"

JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"
```

---

## 6. Cài đặt & cấu hình Prisma

### Khởi tạo Prisma

```bash
npx prisma init
```

### Định nghĩa schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String         @id @default(cuid())
  name         String
  email        String         @unique
  password     String
  role         Role           @default(USER)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@map("refresh_tokens")
}

enum Role {
  USER
  ADMIN
}
```

### Chạy migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Tạo PrismaService (`src/prisma/prisma.service.ts`)

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Tạo PrismaModule (`src/prisma/prisma.module.ts`)

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Global để không cần import lại ở mọi module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 7. Tạo Auth Module

### DTO — Data Transfer Object

**`src/auth/dto/register.dto.ts`**
```typescript
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password phải có ít nhất 6 ký tự' })
  password: string;
}
```

**`src/auth/dto/login.dto.ts`**
```typescript
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

---

## 8. Implement Register & Login

### UsersService (`src/users/users.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // KHÔNG select password
      },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }
}
```

### AuthService (`src/auth/auth.service.ts`)

```typescript
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ─── REGISTER ─────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // 2. Hash password (KHÔNG bao giờ lưu plain text)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Tạo user mới
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    // 4. Trả về (bỏ password)
    const { password, ...result } = user;
    return result;
  }

  // ─── VALIDATE USER (dùng cho Local Strategy) ──────────────

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const { password: _, ...result } = user;
    return result;
  }

  // ─── LOGIN ────────────────────────────────────────────────

  async login(user: any) {
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Lưu refresh token vào DB
    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────

  async refreshTokens(userId: string, refreshToken: string) {
    // 1. Tìm token trong DB
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.userId !== userId) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    // 2. Kiểm tra hết hạn
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException('Refresh token đã hết hạn, vui lòng đăng nhập lại');
    }

    // 3. Xóa token cũ (Rotation - bảo mật hơn)
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    // 4. Tạo cặp token mới
    const user = tokenRecord.user;
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  // ─── LOGOUT ───────────────────────────────────────────────

  async logout(userId: string) {
    // Xóa tất cả refresh token của user (logout tất cả thiết bị)
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return { message: 'Đăng xuất thành công' };
  }

  // ─── HELPER METHODS ───────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
  }
}
```

### AuthController (`src/auth/auth.controller.ts`)

```typescript
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req) {
    // LocalAuthGuard đã xác thực và gắn user vào req.user
    return this.authService.login(req.user);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req) {
    const { id, refreshToken } = req.user;
    return this.authService.refreshTokens(id, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```

---

## 9. JWT Strategy với Passport

### Local Strategy (`src/auth/strategies/local.strategy.ts`)

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // Dùng email thay vì username
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return user; // Gắn vào req.user
  }
}
```

### JWT Access Strategy (`src/auth/strategies/jwt.strategy.ts`)

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      // Lấy token từ Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Tự động từ chối token hết hạn
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // Payload đã được verify signature bởi Passport
    // Đây là nơi để kiểm tra thêm (vd: user còn active không)
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### JWT Refresh Strategy (`src/auth/strategies/jwt-refresh.strategy.ts`)

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true, // Cần req để lấy raw token
    });
  }

  async validate(req: Request, payload: any) {
    // Lấy raw refresh token từ header
    const authHeader = req.get('Authorization');
    const refreshToken = authHeader?.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
```

---

## 10. Guard & bảo vệ Route

### Guards

**`src/auth/guards/local-auth.guard.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

**`src/auth/guards/jwt-auth.guard.ts`**
```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Kiểm tra route có được đánh dấu @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return user;
  }
}
```

**`src/auth/guards/jwt-refresh.guard.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
```

### Decorators

**`src/auth/decorators/current-user.decorator.ts`**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // Nếu truyền key, trả về field đó; không thì trả về cả user
    return data ? user?.[data] : user;
  },
);
```

**`src/auth/decorators/public.decorator.ts`**
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**`src/auth/decorators/roles.decorator.ts`**
```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### Roles Guard (`src/auth/guards/roles.guard.ts`)

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true; // Không yêu cầu role cụ thể

    const { user } = context.switchToHttp().getRequest();

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    return true;
  }
}
```

---

## 11. Refresh Token

### AuthModule (`src/auth/auth.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}), // Config động qua ConfigService trong Strategy
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
})
export class AuthModule {}
```

### AppModule (`src/app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // Áp dụng JWT guard cho TOÀN BỘ app
    // Dùng @Public() để bỏ qua cho route public
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

### main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt validation pipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Loại bỏ fields không có trong DTO
      forbidNonWhitelisted: true, // Throw error nếu có field lạ
      transform: true,        // Tự động transform type
    }),
  );

  app.setGlobalPrefix('api/v1');

  await app.listen(3000);
  console.log('Server đang chạy tại http://localhost:3000');
}
bootstrap();
```

---

## 12. Best Practices & Security

### Ví dụ sử dụng trong Controller

```typescript
// Bất kỳ route nào cũng được bảo vệ bởi JwtAuthGuard (global)

@Controller('users')
export class UsersController {

  // Route PUBLIC — không cần token
  @Public()
  @Get('count')
  getUserCount() { ... }

  // Route cần xác thực — mặc định
  @Get('profile')
  getProfile(@CurrentUser() user) {
    return user;
  }

  // Route chỉ dành cho ADMIN
  @Roles(Role.ADMIN)
  @Delete(':id')
  deleteUser(@Param('id') id: string) { ... }
}
```

### Checklist bảo mật

| # | Việc cần làm | Lý do |
|---|---|---|
| ✅ | **Hash password** với bcrypt (salt rounds ≥ 10) | Bảo vệ khi DB bị leak |
| ✅ | **Access Token ngắn hạn** (15m – 1h) | Giới hạn thiệt hại nếu bị đánh cắp |
| ✅ | **Refresh Token Rotation** | Mỗi lần refresh, tạo token mới & xóa cái cũ |
| ✅ | **Lưu Refresh Token trong DB** | Có thể revoke khi logout hoặc phát hiện bất thường |
| ✅ | **Không lưu thông tin nhạy cảm trong payload** | Payload chỉ được encode, không encrypt |
| ✅ | **HTTPS trong production** | Ngăn chặn token bị sniff qua mạng |
| ✅ | **HttpOnly Cookie cho Refresh Token** | Ngăn JavaScript đọc token (chống XSS) |
| ✅ | **Rate limiting** cho endpoint login | Chống brute force attack |
| ✅ | **Validate & sanitize tất cả input** | Chống injection |
| ✅ | **SECRET_KEY phức tạp và khác nhau** | Access & Refresh dùng secret riêng biệt |

### Rate Limiting cho Auth (Bonus)

```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 phút
      limit: 5,    // Tối đa 5 request
    }]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
```

```typescript
// auth.controller.ts — chỉ áp dụng cho login
@Throttle({ default: { limit: 5, ttl: 60000 } })
@UseGuards(LocalAuthGuard)
@Post('login')
async login(@Request() req) { ... }
```

---

## Tóm tắt Flow

```
Register  →  Hash password  →  Lưu DB
Login     →  Validate credentials  →  Tạo Access + Refresh Token  →  Lưu RT vào DB
Request   →  Gửi Access Token  →  Verify signature  →  Truy cập resource
Expire    →  Gửi Refresh Token  →  Kiểm tra DB  →  Tạo cặp token mới
Logout    →  Xóa Refresh Token trong DB
```

---

> 💡 **Ghi chú cuối**: Đây là nền tảng vững chắc cho hệ thống auth thực tế. Bước tiếp theo có thể mở rộng với: **Email verification**, **2FA (Two-Factor Auth)**, **OAuth2 (Google/GitHub login)**, hoặc tích hợp **Redis** để blacklist token nhanh hơn.