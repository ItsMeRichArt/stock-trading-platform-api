import { IsString, IsNumber, IsPositive, IsEnum, IsOptional } from 'class-validator';
import { TransactionType, TransactionStatus } from '../../../common/dto/common.dto';

export class CreateTransactionDto {
  @IsString()
  userId: string;

  @IsString()
  stockId: string;

  @IsString()
  symbol: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;
}

export class TransactionDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  stockId: string;

  @IsString()
  symbol: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  total: number;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  createdAt: Date;

  @IsOptional()
  processedAt?: Date;
}

export class ProcessTransactionDto {
  @IsString()
  transactionId: string;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
