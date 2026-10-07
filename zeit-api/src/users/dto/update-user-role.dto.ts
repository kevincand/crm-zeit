import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { UserRole } from '../../../generated/prisma/client';

export class UpdateUserRoleDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}