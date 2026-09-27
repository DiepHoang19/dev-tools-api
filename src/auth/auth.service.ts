import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

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
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.users.create(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    delete (user as Partial<User>).password;
    return this.issueTokens(user);
  }

  me(userId: string): Promise<User> {
    return this.users.findOne(userId);
  }

  async refresh(refreshToken: string) {
    const user = await this.getRefreshTokenUser(refreshToken);
    delete (user as Partial<User>).refreshTokenHash;
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
        !user?.refreshTokenHash ||
        !this.matchesRefreshToken(refreshToken, user.refreshTokenHash)
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
      email: user.email,
      role: user.role,
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
      accessToken,
      refreshToken,
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
