import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
