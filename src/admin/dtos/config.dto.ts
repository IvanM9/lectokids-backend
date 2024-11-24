import { ApiProperty } from "@nestjs/swagger";
import { IsJSON, IsOptional, IsString } from "class-validator";

export class ConfigDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    modelText: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    modelImage: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    bucketName: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    apiKey: string;

    @ApiProperty()
    @IsOptional()
    @IsJSON({
        message: 'Firebase key debe ser un JSON'
    })
    firebaseKey: string;
}