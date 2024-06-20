import { ApiProperty, OmitType } from '@nestjs/swagger';
import { TypeMultimedia } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMultimediaDto {
  @ApiProperty({
    type: 'string',
    enum: TypeMultimedia,
    default: TypeMultimedia.IMAGE,
  })
  @IsEnum(TypeMultimedia)
  type: TypeMultimedia;

  @ApiProperty({ required: false })
  @IsOptional()
  description: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    maxItems: 5,
  })
  files: Array<Express.Multer.File>;
}

export class CreateLinkMultimediaDto extends OmitType(CreateMultimediaDto, [
  'files',
] as const) {
  @ApiProperty()
  @IsUrl()
  url: string;
}
