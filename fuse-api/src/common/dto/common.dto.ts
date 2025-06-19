import { IsString, IsNumber, IsPositive, IsEnum, IsOptional } from 'class-validator';

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class PaginationDto {
  @IsOptional()
  @IsString()
  nextToken?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  limit?: number = 50;
}

export class ApiResponseDto<T> {
  status: number;
  data: T;
  message?: string;
}
