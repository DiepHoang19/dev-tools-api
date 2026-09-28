import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Mechanical Keyboard' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'KEYBOARD-001' })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiPropertyOptional({ example: 'Hot-swappable mechanical keyboard' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 129.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 25, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;
}
