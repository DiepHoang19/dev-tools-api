import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './strategies/jwt.strategy';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register and receive access/refresh tokens' })
  @ResponseMessage('Account registered successfully')
  register(@Body() dto: CreateUserDto) {
    return this.service.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive access/refresh tokens' })
  @ResponseMessage('Login successful')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and receive new tokens' })
  @ResponseMessage('Token refreshed successfully')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.service.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the current account refresh token' })
  @ResponseMessage('Logout successful')
  logout(@CurrentUser() user: JwtPayload) {
    return this.service.logout(user.sub);
  }
}
