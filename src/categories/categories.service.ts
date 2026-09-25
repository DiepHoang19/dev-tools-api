import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { slugify } from '../common/utils/slug.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(dto.name);
    if (await this.categories.exists({ where: { slug } })) {
      throw new ConflictException('Category slug already exists');
    }
    return this.categories.save(this.categories.create({ ...dto, slug }));
  }

  findAll(): Promise<Category[]> {
    return this.categories.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name) {
      const slug = slugify(dto.name);
      const duplicate = await this.categories.findOne({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Category slug already exists');
      }
      category.slug = slug;
    }
    Object.assign(category, dto);
    return this.categories.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categories.delete(id);
    if (!result.affected) throw new NotFoundException('Category not found');
  }
}
