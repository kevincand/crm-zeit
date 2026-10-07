import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../generated/prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name!: string;

  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'A palavra-passe deve ter no mínimo 6 caracteres' })
  password!: string;

  @IsEnum(UserRole, { message: 'Papel de utilizador inválido' })
  @IsOptional()
  role?: UserRole;
}