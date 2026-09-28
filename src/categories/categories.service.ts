import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate } from '../common/utils/pagination.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  findAll(query: PaginationQueryDto) {
    return paginate(this.repository, query, {
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.repository.findOneBy({ id });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.ensureSlugAvailable(dto.slug);
    return this.repository.save(this.repository.create(dto));
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.slug && dto.slug !== category.slug) {
      await this.ensureSlugAvailable(dto.slug);
    }
    this.repository.merge(category, dto);
    return this.repository.save(category);
  }

  async remove(id: string): Promise<Category> {
    const category = await this.findOne(id);
    try {
      await this.repository.remove(category);
    } catch {
      throw new ConflictException(
        'Category cannot be deleted while it contains products',
      );
    }
    return category;
  }

  private async ensureSlugAvailable(slug: string): Promise<void> {
    if (await this.repository.existsBy({ slug })) {
      throw new ConflictException('Category slug already exists');
    }
  }
}
