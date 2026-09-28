import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'electronics' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain lowercase letters, numbers and hyphens only',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
  @IsOptional()
  @IsString()
  description?: string;
}
