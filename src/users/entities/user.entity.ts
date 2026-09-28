import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column()
  user_name: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'varchar',
    nullable: true,
    select: false,
  })
  refresh_token: string | null;
}
