import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateUploadDto {
  @ApiProperty({ example: 'new-display-name.jpg' })
  @IsString()
  @MinLength(1)
  originalName: string;
}
