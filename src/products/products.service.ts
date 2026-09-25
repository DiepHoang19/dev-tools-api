import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { slugify } from '../common/utils/slug.util';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    private readonly categories: CategoriesService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = slugify(dto.name);
    if (await this.products.exists({ where: { slug } })) {
      throw new ConflictException('Product slug already exists');
    }
    if (dto.categoryId) await this.categories.findOne(dto.categoryId);
    const product = this.products.create({
      ...dto,
      slug,
      price: dto.price.toFixed(2),
    });
    return this.products.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.products.find({
      relations: { category: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.products.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.categoryId) await this.categories.findOne(dto.categoryId);
    if (dto.name) {
      const slug = slugify(dto.name);
      const duplicate = await this.products.findOne({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Product slug already exists');
      }
      product.slug = slug;
    }
    const { price, ...rest } = dto;
    Object.assign(product, rest);
    if (price !== undefined) product.price = price.toFixed(2);
    return this.products.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.products.delete(id);
    if (!result.affected) throw new NotFoundException('Product not found');
  }
}
