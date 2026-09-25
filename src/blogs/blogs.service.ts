import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { slugify } from '../common/utils/slug.util';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Blog } from './entities/blog.entity';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
    private readonly categories: CategoriesService,
  ) {}

  async create(dto: CreateBlogDto, authorId: string): Promise<Blog> {
    const slug = slugify(dto.title);
    if (await this.blogs.exists({ where: { slug } })) {
      throw new ConflictException('Blog slug already exists');
    }
    if (dto.categoryId) await this.categories.findOne(dto.categoryId);
    return this.blogs.save(this.blogs.create({ ...dto, slug, authorId }));
  }

  findAll(): Promise<Blog[]> {
    return this.blogs.find({
      relations: { author: true, category: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Blog> {
    const blog = await this.blogs.findOne({
      where: { id },
      relations: { author: true, category: true },
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async update(id: string, dto: UpdateBlogDto): Promise<Blog> {
    const blog = await this.findOne(id);
    if (dto.categoryId) await this.categories.findOne(dto.categoryId);
    if (dto.title) {
      const slug = slugify(dto.title);
      const duplicate = await this.blogs.findOne({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Blog slug already exists');
      }
      blog.slug = slug;
    }
    Object.assign(blog, dto);
    return this.blogs.save(blog);
  }

  async remove(id: string): Promise<void> {
    const result = await this.blogs.delete(id);
    if (!result.affected) throw new NotFoundException('Blog not found');
  }
}
