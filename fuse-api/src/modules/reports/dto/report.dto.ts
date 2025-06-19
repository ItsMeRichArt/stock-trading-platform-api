import { IsString, IsNumber, IsDate, IsArray } from 'class-validator';
import { TransactionDto } from '../../transactions/dto/transaction.dto';

export class DailyReportDto {
  @IsDate()
  date: Date;

  @IsNumber()
  totalSuccessfulTransactions: number;

  @IsNumber()
  totalFailedTransactions: number;

  @IsNumber()
  totalVolume: number;

  @IsNumber()
  totalValue: number;

  @IsArray()
  successfulTransactions: TransactionDto[];

  @IsArray()
  failedTransactions: TransactionDto[];
}

export class EmailReportDto {
  @IsString()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  htmlContent: string;

  @IsString()
  textContent: string;
}
