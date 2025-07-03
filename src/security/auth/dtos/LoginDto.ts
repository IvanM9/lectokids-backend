import { ApiProperty } from '@nestjs/swagger';
import { IsIP, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Usuario o correo electrónico' })
  user: string;

  @ApiProperty()
  password: string;
}

export class DetailLoginDto {
  @ApiProperty({ required: false })
  @IsIP()
  @IsOptional()
  ipAddress: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  device: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location: string;
}
