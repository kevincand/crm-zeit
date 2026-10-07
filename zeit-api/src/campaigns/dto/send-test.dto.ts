import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendTestDto {
  @IsEmail({}, { message: 'E-mail de teste inválido.' })
  @IsNotEmpty()
  email!: string;
}