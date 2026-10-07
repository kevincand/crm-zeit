import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}