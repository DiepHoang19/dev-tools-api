import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import { UpdateUploadDto } from './dto/update-upload.dto';
import { Upload } from './entities/upload.entity';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload) private readonly uploads: Repository<Upload>,
  ) {}

  create(file: Express.Multer.File): Promise<Upload> {
    return this.uploads.save(
      this.uploads.create({
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`,
      }),
    );
  }

  findAll(): Promise<Upload[]> {
    return this.uploads.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Upload> {
    const upload = await this.uploads.findOne({ where: { id } });
    if (!upload) throw new NotFoundException('Upload not found');
    return upload;
  }

  async update(id: string, dto: UpdateUploadDto): Promise<Upload> {
    const upload = await this.findOne(id);
    upload.originalName = dto.originalName;
    return this.uploads.save(upload);
  }

  async remove(id: string): Promise<void> {
    const upload = await this.findOne(id);
    await this.uploads.delete(id);
    await unlink(upload.path).catch(() => undefined);
  }
}
