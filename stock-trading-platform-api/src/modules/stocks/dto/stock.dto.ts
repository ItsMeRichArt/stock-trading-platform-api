import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class StockDto {
  @IsString()
  id: string;

  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  lastUpdated: Date;
}

export class VendorStockDto {
  symbol: string;
  name: string;
  price: number;
  // Add other fields that come from the vendor API
}

export class StockListResponseDto {
  items: VendorStockDto[];
  
  @IsOptional()
  @IsString()
  nextToken?: string;
}

export class BuyStockDto {
  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
