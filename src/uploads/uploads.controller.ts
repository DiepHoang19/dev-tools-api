import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'node:path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { UploadsService } from './uploads.service';

// Vercel Functions have a read-only application filesystem. This controller
// is still evaluated because UploadsModule is statically imported, even when
// the module is not registered on Vercel, so diskStorage must not be created
// there during application bootstrap.
const uploadStorage = process.env.VERCEL
  ? memoryStorage()
  : diskStorage({
      destination: process.env.UPLOAD_DIR || 'uploads',
      filename: (_request, file, callback) => {
        const safeExtension = extname(file.originalname).toLowerCase();
        callback(null, `${crypto.randomUUID()}${safeExtension}`);
      },
    });

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      fileFilter: (_request, file, callback) => {
        if (!/^(image|application\/pdf)/.test(file.mimetype)) {
          return callback(
            new BadRequestException('Only images and PDF files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.service.create(file);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUploadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
