import { Column, Entity, OneToMany } from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('api_categories')
export class Category extends BaseEntity {
  @Column({ length: 120 })
  name: string;

  @Column({ unique: true, length: 140 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @OneToMany(() => Blog, (blog) => blog.category)
  blogs: Blog[];
}
