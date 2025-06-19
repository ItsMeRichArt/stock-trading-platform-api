import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class PortfolioStockDto {
  @IsString()
  stockId: string;

  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  averagePrice: number;

  @IsNumber()
  @IsPositive()
  currentPrice: number;

  @IsNumber()
  totalValue: number;

  @IsNumber()
  gain: number;

  @IsNumber()
  gainPercentage: number;
}

export class PortfolioDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  name: string;

  stocks: PortfolioStockDto[];

  @IsNumber()
  totalValue: number;

  @IsNumber()
  totalGain: number;

  @IsNumber()
  totalGainPercentage: number;

  createdAt: Date;
  updatedAt: Date;
}

export class CreatePortfolioDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  name?: string;
}
