import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate } from '../common/utils/pagination.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  findAll(query: PaginationQueryDto) {
    return paginate(this.repository, query, {
      relations: { category: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    await Promise.all([
      this.ensureSkuAvailable(dto.sku),
      this.ensureCategoryExists(dto.categoryId),
    ]);
    const saved = await this.repository.save(this.repository.create(dto));
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.sku && dto.sku !== product.sku) {
      await this.ensureSkuAvailable(dto.sku);
    }
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }
    this.repository.merge(product, dto);
    await this.repository.save(product);
    return this.findOne(id);
  }

  async remove(id: string): Promise<Product> {
    const product = await this.findOne(id);
    await this.repository.remove(product);
    return product;
  }

  private async ensureSkuAvailable(sku: string): Promise<void> {
    if (await this.repository.existsBy({ sku })) {
      throw new ConflictException('Product SKU already exists');
    }
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    if (!(await this.categoryRepository.existsBy({ id: categoryId }))) {
      throw new NotFoundException('Category not found');
    }
  }
}
