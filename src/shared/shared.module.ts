import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { HasingService } from './hasing.service';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';


@Global()
@Module({
  providers: [PrismaService, HasingService, TokenService],
  exports: [PrismaService,HasingService,TokenService],
  //add JwtModule để dùng đc cái module này trong module share
  imports : [JwtModule]
})
export class SharedModule {}
