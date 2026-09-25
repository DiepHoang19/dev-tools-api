import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ length: 160 })
  name: string;

  @Column({ unique: true, length: 180 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'varchar', nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;
}
