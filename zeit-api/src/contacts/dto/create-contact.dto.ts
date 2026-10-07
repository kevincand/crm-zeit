import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsUUID, ValidateIf, IsIn } from 'class-validator';

const UFS_VALIDAS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export class CreateContactDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  name!: string;

  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @ValidateIf((o) => o.uf !== '' && o.uf !== undefined && o.uf !== null)
  @IsIn(UFS_VALIDAS, { message: 'uf deve ser uma sigla de estado válida (ex: RS, SC, PR)' })
  uf?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  groupIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  interestIds?: string[];
}