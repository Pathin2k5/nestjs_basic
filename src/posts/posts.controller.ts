import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postSerive: PostsService) {}
  //Phương thức get lấy ra tất cả các post
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
