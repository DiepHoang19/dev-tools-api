import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('AuthService', () => {
  const user = {
    id: '2a29b056-30e2-43e4-a49e-950562752faf',
    user_name: 'test-user',
    password: 'hashed-password',
    refresh_token: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as User;
  const users = {
    create: jest.fn(),
    findByUserNameWithPassword: jest.fn(),
    findByIdWithRefreshToken: jest.fn(),
    setRefreshTokenHash: jest.fn(),
    clearRefreshToken: jest.fn(),
  };
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const config = {
    getOrThrow: jest.fn((key: string) => `${key}-value`),
    get: jest.fn((_key: string, fallback: string) => fallback),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      users as unknown as UsersService,
    );
  });

  it('issues tokens and stores only a refresh-token hash', async () => {
    users.create.mockResolvedValue(user);
    jwt.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.register({
        user_name: user.user_name,
        password: 'StrongPass123',
      }),
    ).resolves.toMatchObject({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      tokenType: 'Bearer',
      user: { id: user.id, user_name: user.user_name },
    });
    expect(users.setRefreshTokenHash).toHaveBeenCalledWith(
      user.id,
      createHash('sha256').update('refresh-token').digest('hex'),
    );
  });

  it('logs in with valid credentials', async () => {
    users.findByUserNameWithPassword.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jwt.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.login({ user_name: user.user_name, password: 'StrongPass123' }),
    ).resolves.toMatchObject({ access_token: 'access-token' });
  });

  it('rotates a valid refresh token', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: user.id, type: 'refresh' });
    users.findByIdWithRefreshToken.mockResolvedValue({
      ...user,
      refresh_token: createHash('sha256')
        .update('old-refresh-token')
        .digest('hex'),
    });
    jwt.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    await expect(service.refresh('old-refresh-token')).resolves.toMatchObject({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });
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
