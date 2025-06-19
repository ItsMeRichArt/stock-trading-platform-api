import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { firstValueFrom, retry, catchError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { 
  StockDto, 
  VendorStockDto, 
  StockListResponseDto, 
  BuyStockDto 
} from './dto/stock.dto';
import { ApiResponseDto } from '../../common/dto/common.dto';
import { VendorApiConfig } from '../../config/configuration';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);
  private readonly vendorConfig: VendorApiConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.vendorConfig = this.configService.get<VendorApiConfig>('vendorApi');
  }

  /**
   * Get stocks from vendor API with pagination
   */
  async getStocksFromVendor(nextToken?: string): Promise<StockListResponseDto> {
    const url = `${this.vendorConfig.baseUrl}/stocks`;
    const params = nextToken ? { nextToken } : {};

    try {
      this.logger.log(`Fetching stocks from vendor API: ${url}`);
      
      const response$ = this.httpService.get(url, {
        headers: {
          'x-api-key': this.vendorConfig.apiKey,
        },
        params,
      }).pipe(
        retry({
          count: this.vendorConfig.retryAttempts,
          delay: this.vendorConfig.retryDelay,
        }),
        catchError((error) => {
          this.logger.error(`Vendor API error: ${error.message}`, error.stack);
          throw new HttpException(
            'Vendor API temporarily unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }),
      );

      const response: AxiosResponse<ApiResponseDto<StockListResponseDto>> = 
        await firstValueFrom(response$);

      if (response.data.status !== 200) {
        throw new HttpException(
          'Invalid response from vendor API',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const stockData = response.data.data;
      
      // Update local stock cache
      await this.updateStockCache(stockData.items);

      this.logger.log(`Successfully fetched ${stockData.items.length} stocks`);
      return stockData;

    } catch (error) {
      this.logger.error(`Error fetching stocks: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all stocks with pagination support
   */
  async getAllStocks(nextToken?: string): Promise<StockListResponseDto> {
    return this.getStocksFromVendor(nextToken);
  }

  /**
   * Get stock by symbol from cache or vendor
   */
  async getStockBySymbol(symbol: string): Promise<StockDto | null> {
    try {
      // First try to get from local cache
      let stock = await this.prisma.stock.findUnique({
        where: { symbol: symbol.toUpperCase() },
      });

      // If not found or data is stale (older than 5 minutes), fetch from vendor
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (!stock || stock.lastUpdated < fiveMinutesAgo) {
        this.logger.log(`Stock ${symbol} not in cache or stale, fetching from vendor`);
        
        // Get fresh data from vendor (we'll need to implement this)
        const vendorStocks = await this.getStocksFromVendor();
        const vendorStock = vendorStocks.items.find(
          s => s.symbol.toUpperCase() === symbol.toUpperCase()
        );

        if (!vendorStock) {
          return null;
        }

        // Update cache
        stock = await this.prisma.stock.upsert({
          where: { symbol: symbol.toUpperCase() },
          update: {
            name: vendorStock.name,
            price: vendorStock.price,
            lastUpdated: new Date(),
          },
          create: {
            symbol: symbol.toUpperCase(),
            name: vendorStock.name,
            price: vendorStock.price,
            lastUpdated: new Date(),
          },
        });
      }

      return {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        lastUpdated: stock.lastUpdated,
      };

    } catch (error) {
      this.logger.error(`Error getting stock ${symbol}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Buy stock through vendor API
   */
  async buyStock(
    symbol: string, 
    buyData: BuyStockDto, 
    userId: string
  ): Promise<{ success: boolean; message?: string; transactionId?: string }> {
    
    const url = `${this.vendorConfig.baseUrl}/stocks/${symbol.toUpperCase()}/buy`;

    try {
      this.logger.log(`Attempting to buy ${buyData.quantity} shares of ${symbol} at $${buyData.price}`);

      // Get current stock info for validation
      const currentStock = await this.getStockBySymbol(symbol);
      if (!currentStock) {
        throw new HttpException(`Stock ${symbol} not found`, HttpStatus.NOT_FOUND);
      }

      // Validate price within 2% tolerance
      const priceDifference = Math.abs(currentStock.price - buyData.price);
      const tolerance = currentStock.price * 0.02; // 2%
      
      if (priceDifference > tolerance) {
        const message = `Price ${buyData.price} is outside 2% tolerance of current price ${currentStock.price}`;
        this.logger.warn(message);
        return { success: false, message };
      }

      // Create pending transaction
      const transaction = await this.prisma.transaction.create({
        data: {
          userId,
          stockId: currentStock.id,
          type: 'BUY',
          quantity: buyData.quantity,
          price: buyData.price,
          totalAmount: buyData.price * buyData.quantity,
          status: 'PENDING',
        },
      });

      try {
        // Call vendor API
        const response$ = this.httpService.post(url, {
          price: buyData.price,
          quantity: buyData.quantity,
        }, {
          headers: {
            'x-api-key': this.vendorConfig.apiKey,
          },
        }).pipe(
          retry({
            count: this.vendorConfig.retryAttempts,
            delay: this.vendorConfig.retryDelay,
          }),
          catchError((error) => {
            this.logger.error(`Vendor buy API error: ${error.message}`, error.stack);
            throw error;
          }),
        );

        const response = await firstValueFrom(response$);

        // Update transaction as successful
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SUCCESS',
            processedAt: new Date(),
          },
        });

        // Update user's portfolio
        await this.updateUserPortfolio(userId, currentStock.id, buyData.quantity, buyData.price);

        this.logger.log(`Successfully purchased ${buyData.quantity} shares of ${symbol}`);
        return { success: true, transactionId: transaction.id };

      } catch (vendorError) {
        // Update transaction as failed
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            errorMessage: vendorError.message,
            processedAt: new Date(),
          },
        });

        this.logger.error(`Failed to purchase stock: ${vendorError.message}`);
        return { 
          success: false, 
          message: vendorError.message,
          transactionId: transaction.id 
        };
      }

    } catch (error) {
      this.logger.error(`Error in buyStock: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update local stock cache
   */
  private async updateStockCache(vendorStocks: VendorStockDto[]): Promise<void> {
    try {
      const updatePromises = vendorStocks.map(vendorStock =>
        this.prisma.stock.upsert({
          where: { symbol: vendorStock.symbol.toUpperCase() },
          update: {
            name: vendorStock.name,
            price: vendorStock.price,
            lastUpdated: new Date(),
          },
          create: {
            symbol: vendorStock.symbol.toUpperCase(),
            name: vendorStock.name,
            price: vendorStock.price,
            lastUpdated: new Date(),
          },
        })
      );

      await Promise.all(updatePromises);
      this.logger.log(`Updated cache for ${vendorStocks.length} stocks`);

    } catch (error) {
      this.logger.error(`Error updating stock cache: ${error.message}`, error.stack);
      // Don't throw here, cache update failure shouldn't break the main flow
    }
  }

  /**
   * Update user's portfolio after successful purchase
   */
  private async updateUserPortfolio(
    userId: string, 
    stockId: string, 
    quantity: number, 
    price: number
  ): Promise<void> {
    try {
      // Get or create user's default portfolio
      let portfolio = await this.prisma.portfolio.findFirst({
        where: { userId },
      });

      if (!portfolio) {
        portfolio = await this.prisma.portfolio.create({
          data: {
            userId,
            name: 'Default Portfolio',
          },
        });
      }

      // Get existing position
      const existingPosition = await this.prisma.portfolioStock.findUnique({
        where: {
          portfolioId_stockId: {
            portfolioId: portfolio.id,
            stockId,
          },
        },
      });

      if (existingPosition) {
        // Update existing position (calculate new average price)
        const totalShares = existingPosition.quantity + quantity;
        const totalCost = (existingPosition.quantity * existingPosition.averagePrice) + (quantity * price);
        const newAveragePrice = totalCost / totalShares;

        await this.prisma.portfolioStock.update({
          where: { id: existingPosition.id },
          data: {
            quantity: totalShares,
            averagePrice: newAveragePrice,
          },
        });
      } else {
        // Create new position
        await this.prisma.portfolioStock.create({
          data: {
            portfolioId: portfolio.id,
            stockId,
            quantity,
            averagePrice: price,
          },
        });
      }

      this.logger.log(`Updated portfolio for user ${userId}`);

    } catch (error) {
      this.logger.error(`Error updating portfolio: ${error.message}`, error.stack);
      throw error;
    }
  }
}
