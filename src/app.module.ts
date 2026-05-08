import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';

@Module({
  //imports module posts vào appmodule tổng
  imports: [PostsModule, SharedModule,AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
