import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('blogs')
export class Blog extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ unique: true, length: 220 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt?: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  coverImage?: string | null;

  @Column({ default: false })
  published: boolean;

  @Column({ type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, (user) => user.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => Category, (category) => category.blogs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;
}
