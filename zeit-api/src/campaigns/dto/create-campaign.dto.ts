import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome interno da campanha é obrigatório.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'O assunto é obrigatório.' })
  subject!: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome do remetente é obrigatório.' })
  fromName!: string;

  @IsEmail({}, { message: 'E-mail do remetente inválido.' })
  @IsNotEmpty({ message: 'O e-mail do remetente é obrigatório.' })
  fromEmail!: string;

  @IsString()
  @IsNotEmpty({ message: 'O conteúdo HTML é obrigatório.' })
  contentHtml!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  groupIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  interestIds?: string[];
}