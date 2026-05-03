import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prismaService : PrismaService){}
  getAllPost() {

    return this.prismaService.post.findMany();
  }
  getPostById(id: string) {
      return this.prismaService.post.findMany({
      where : {id : Number(id)}
    });
  }
  upPost(body: any) {
    return this.prismaService.post.create({
      data : {
        title : body.title,
        content: body.content,
        authorId : 1
      }
    }
    )
  }
  updatePost(body: any, id: string) {
    return this.prismaService.post.update(
      {
        where: {id:Number(id)},
        data:{
          title :body.title,
          content: body.content,
          
        }
      }
    )
  }
  deletePost(id: string) {
    return this.prismaService.post.delete(
      {
        where : {id : Number(id)}
      }
    )
  }
}
