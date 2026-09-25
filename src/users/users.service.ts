import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const email = dto.email.toLowerCase().trim();
    if (await this.users.exists({ where: { email } })) {
      throw new ConflictException('Email already exists');
    }
    const user = this.users.create({
      ...dto,
      email,
      password: await bcrypt.hash(dto.password, 12),
    });
    const saved = await this.users.save(user);
    delete (saved as Partial<User>).password;
    return saved;
  }

  findAll(): Promise<User[]> {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email: email.toLowerCase().trim() },
      select: [
        'id',
        'name',
        'email',
        'password',
        'role',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const duplicate = await this.users.findOne({ where: { email } });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Email already exists');
      }
      dto.email = email;
    }
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 12);
    Object.assign(user, dto);
    const saved = await this.users.save(user);
    delete (saved as Partial<User>).password;
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.users.delete(id);
    if (!result.affected) throw new NotFoundException('User not found');
  }
}
