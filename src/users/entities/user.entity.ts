import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  user_name: string;

  @Column()
  password: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  refresh_token: string | null;
}
