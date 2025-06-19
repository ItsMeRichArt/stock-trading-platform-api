import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  Query, 
  HttpStatus, 
  Logger,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import { 
  StockListResponseDto, 
  BuyStockDto, 
  StockDto 
} from './dto/stock.dto';
import { PaginationDto, ApiResponseDto } from '../../common/dto/common.dto';

@Controller('stocks')
export class StocksController {
  private readonly logger = new Logger(StocksController.name);

  constructor(private readonly stocksService: StocksService) {}

  /**
   * GET /stocks - List available stocks with pagination
   */
  @Get()
  async getStocks(
    @Query() paginationDto: PaginationDto
  ): Promise<ApiResponseDto<StockListResponseDto>> {
    try {
      this.logger.log('Getting stocks list');
      
      const stocks = await this.stocksService.getAllStocks(paginationDto.nextToken);
      
      return {
        status: HttpStatus.OK,
        data: stocks,
        message: 'Stocks retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting stocks: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /stocks/:symbol - Get specific stock by symbol
   */
  @Get(':symbol')
  async getStockBySymbol(
    @Param('symbol') symbol: string
  ): Promise<ApiResponseDto<StockDto | null>> {
    try {
      this.logger.log(`Getting stock by symbol: ${symbol}`);
      
      const stock = await this.stocksService.getStockBySymbol(symbol);
      
      return {
        status: HttpStatus.OK,
        data: stock,
        message: stock ? 'Stock retrieved successfully' : 'Stock not found',
      };
    } catch (error) {
      this.logger.error(`Error getting stock ${symbol}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /stocks/:symbol/buy - Buy stock
   * Note: In a real application, userId would come from authentication
   */
  @Post(':symbol/buy')
  async buyStock(
    @Param('symbol') symbol: string,
    @Body(ValidationPipe) buyStockDto: BuyStockDto,
    @Query('userId') userId: string // In real app, this would come from JWT/auth
  ): Promise<ApiResponseDto<{ success: boolean; message?: string; transactionId?: string }>> {
    try {
      this.logger.log(`User ${userId} attempting to buy ${buyStockDto.quantity} shares of ${symbol}`);
      
      if (!userId) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: { success: false, message: 'User ID is required' },
          message: 'Bad request',
        };
      }

      const result = await this.stocksService.buyStock(symbol, buyStockDto, userId);
      
      return {
        status: result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
        data: result,
        message: result.success ? 'Purchase completed' : 'Purchase failed',
      };
    } catch (error) {
      this.logger.error(`Error buying stock ${symbol}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
