import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.users.create(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOneBy({
      user_name: dto.user_name,
    });
    if (!user) {
      throw new NotFoundException('Tải khoản không tồn tại');
    }
    const isValidPassword = await bcrypt.compare(dto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Thông tin tài khoản không chính xác');
    }
    delete (user as Partial<User>).password;
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const user = await this.getRefreshTokenUser(refreshToken);
    delete (user as Partial<User>).refresh_token;
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.users.clearRefreshToken(userId);
  }

  private async getRefreshTokenUser(refreshToken: string): Promise<User> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.users.findByIdWithRefreshToken(payload.sub);
      if (
        !user?.refresh_token ||
        !this.matchesRefreshToken(refreshToken, user.refresh_token)
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async issueTokens(user: User) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      user_name: user.user_name,
      type: 'access',
    });
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '30d',
        ) as JwtSignOptions['expiresIn'],
      },
    );

    await this.users.setRefreshTokenHash(
      user.id,
      this.hashRefreshToken(refreshToken),
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      tokenType: 'Bearer',
      user,
    };
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private matchesRefreshToken(
    refreshToken: string,
    storedHash: string,
  ): boolean {
    const tokenHash = Buffer.from(this.hashRefreshToken(refreshToken), 'hex');
    const expectedHash = Buffer.from(storedHash, 'hex');
    return (
      tokenHash.length === expectedHash.length &&
      timingSafeEqual(tokenHash, expectedHash)
    );
  }
}
