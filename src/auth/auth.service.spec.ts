import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  const user = {
    id: '2a29b056-30e2-43e4-a49e-950562752faf',
    name: 'Test User',
    email: 'user@example.com',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  const users = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findByIdWithRefreshToken: jest.fn(),
    setRefreshTokenHash: jest.fn(),
    clearRefreshToken: jest.fn(),
  };
  const jwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const config = {
    getOrThrow: jest.fn((key: string) => `${key}-value`),
    get: jest.fn((_key: string, fallback: string) => fallback),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('returns the current account from the database', async () => {
    users.findOne.mockResolvedValue(user);

    await expect(service.me(user.id)).resolves.toBe(user);
    expect(users.findOne).toHaveBeenCalledWith(user.id);
  });

  it('issues access and refresh tokens and stores only a hash', async () => {
    users.create.mockResolvedValue(user);
    jwt.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.register({
        name: user.name,
        email: user.email,
        password: 'StrongPass123',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      user,
    });
    expect(users.setRefreshTokenHash).toHaveBeenCalledWith(
      user.id,
      createHash('sha256').update('refresh-token').digest('hex'),
    );
  });

  it('rotates a valid refresh token', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: user.id, type: 'refresh' });
    users.findByIdWithRefreshToken.mockResolvedValue({
      ...user,
      refreshTokenHash: createHash('sha256')
        .update('old-refresh-token')
        .digest('hex'),
    });
    jwt.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');
    jest.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

    await expect(service.refresh('old-refresh-token')).resolves.toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(users.setRefreshTokenHash).toHaveBeenCalledWith(
      user.id,
      createHash('sha256').update('new-refresh-token').digest('hex'),
    );
  });

  it('rejects an invalid refresh token', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));

    await expect(service.refresh('invalid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokes refresh access on logout', async () => {
    await service.logout(user.id);

    expect(users.clearRefreshToken).toHaveBeenCalledWith(user.id);
  });
});
