import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email!: string;

  @IsString()
  @IsOptional()
  source?: string; // Ex: LANDING_PAGE, SITE, FORMULARIO
}