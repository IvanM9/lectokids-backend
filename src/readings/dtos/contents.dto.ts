import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateContentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsString()
  detailReadingId: string;
}

export class CreateContentForAllDto extends OmitType(CreateContentDto, [
  'detailReadingId',
]) {
  @ApiProperty()
  @IsString()
  readingId: string;
}
