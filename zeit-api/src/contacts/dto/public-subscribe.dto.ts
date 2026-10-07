import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class PublicSubscribeDto {
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  @IsString()
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestIds?: string[];
}