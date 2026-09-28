import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginate } from '../common/utils/pagination.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findAll(query: PaginationQueryDto) {
    return paginate(this.repository, query, {
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUserNameWithPassword(userName: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.user_name = :userName', { userName })
      .getOne();
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.refresh_token')
      .where('user.id = :id', { id })
      .getOne();
  }

  async create(dto: CreateUserDto): Promise<User> {
    await this.ensureUserNameAvailable(dto.user_name);
    const user = this.repository.create({
      user_name: dto.user_name,
      password: await bcrypt.hash(dto.password, 10),
    });
    const saved = await this.repository.save(user);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.user_name && dto.user_name !== user.user_name) {
      await this.ensureUserNameAvailable(dto.user_name);
      user.user_name = dto.user_name;
    }
    if (dto.password) user.password = await bcrypt.hash(dto.password, 10);
    await this.repository.save(user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<User> {
    const user = await this.findOne(id);
    await this.repository.remove(user);
    return user;
  }

  async setRefreshTokenHash(id: string, hash: string): Promise<void> {
    const result = await this.repository.update(id, { refresh_token: hash });
    if (!result.affected) throw new NotFoundException('User not found');
  }

  async clearRefreshToken(id: string): Promise<void> {
    const result = await this.repository.update(id, { refresh_token: null });
    if (!result.affected) throw new NotFoundException('User not found');
  }

  private async ensureUserNameAvailable(userName: string): Promise<void> {
    if (await this.repository.existsBy({ user_name: userName })) {
      throw new ConflictException('Username already exists');
    }
  }
}
