import { IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterContactDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsUUID()
  interestId?: string;
}