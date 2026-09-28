import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from './common/decorators/response-message.decorator';

@ApiTags('health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ResponseMessage('Service is healthy')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
