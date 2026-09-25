import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany } from 'typeorm';
import { Blog } from '../../blogs/entities/blog.entity';
import { BaseEntity } from '../../common/entities/base.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('api_users')
export class User extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @OneToMany(() => Blog, (blog) => blog.author)
  blogs: Blog[];
}
