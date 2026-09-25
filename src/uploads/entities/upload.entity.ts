import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('uploads')
export class Upload extends BaseEntity {
  @Column()
  originalName: string;

  @Column({ unique: true })
  filename: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column()
  path: string;

  @Column()
  url: string;
}
