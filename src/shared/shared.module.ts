import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { HasingService } from './hasing.service';


@Global()
@Module({
  providers: [PrismaService, HasingService],
  exports: [PrismaService,HasingService]
})
export class SharedModule {}
