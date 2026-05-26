import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Auth } from 'src/shared/decorator/auth.decorator';
import { AuthType, ConditionGuard } from 'src/shared/constants/auth.constant';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guards';

@Controller('posts')
export class PostsController {
  constructor(private readonly postSerive: PostsService) {}
  //Phương thức get lấy ra tất cả các post
  @Auth([AuthType.Bearer,AuthType.ApiKey],{condition : ConditionGuard.Or})
  @UseGuards(AuthenticationGuard)
  @Get()
  getPosts() {
    return this.postSerive.getAllPost();
  }
  //Phương thức get lấy ra theo id
  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.postSerive.getPostById(id);
  }
  //Phương thức post
  @Post()
  upPosts(@Body() body: any) {
    return this.postSerive.upPost(body);
  }
  //phương thức put
  @Put(':id')
  updatePosts(@Body() body: any, @Param('id') id: string) {
    return this.postSerive.updatePost(body, id);
  }
  //phương thức delete
  @Delete(':id')
  deletePost(@Param('id') id: string) {
    return this.postSerive.deletePost(id);
  }
}
