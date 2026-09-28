import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { BaseEntity } from '../../common/entities/base.entity';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string) => Number(value),
};

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
