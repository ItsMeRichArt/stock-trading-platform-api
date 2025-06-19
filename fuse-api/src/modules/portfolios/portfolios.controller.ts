import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  Query, 
  HttpStatus, 
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { 
  PortfolioDto, 
  CreatePortfolioDto 
} from './dto/portfolio.dto';
import { ApiResponseDto } from '../../common/dto/common.dto';

@Controller('portfolios')
export class PortfoliosController {
  private readonly logger = new Logger(PortfoliosController.name);

  constructor(private readonly portfoliosService: PortfoliosService) {}

  /**
   * GET /portfolios - Get user's portfolios
   */
  @Get()
  async getUserPortfolios(
    @Query('userId') userId: string // In real app, this would come from JWT/auth
  ): Promise<ApiResponseDto<PortfolioDto[]>> {
    try {
      this.logger.log(`Getting portfolios for user: ${userId}`);
      
      if (!userId) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: [],
          message: 'User ID is required',
        };
      }

      const portfolios = await this.portfoliosService.getUserPortfolios(userId);
      
      return {
        status: HttpStatus.OK,
        data: portfolios,
        message: 'Portfolios retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting portfolios: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /portfolios/:id - Get specific portfolio
   */
  @Get(':id')
  async getPortfolioById(
    @Param('id') portfolioId: string,
    @Query('userId') userId: string
  ): Promise<ApiResponseDto<PortfolioDto>> {
    try {
      this.logger.log(`Getting portfolio ${portfolioId} for user ${userId}`);
      
      if (!userId) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: null,
          message: 'User ID is required',
        };
      }

      const portfolio = await this.portfoliosService.getPortfolioById(portfolioId, userId);
      
      return {
        status: HttpStatus.OK,
        data: portfolio,
        message: 'Portfolio retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting portfolio ${portfolioId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /portfolios - Create new portfolio
   */
  @Post()
  async createPortfolio(
    @Body(ValidationPipe) createPortfolioDto: CreatePortfolioDto
  ): Promise<ApiResponseDto<PortfolioDto>> {
    try {
      this.logger.log(`Creating portfolio for user: ${createPortfolioDto.userId}`);
      
      const portfolio = await this.portfoliosService.createPortfolio(createPortfolioDto);
      
      return {
        status: HttpStatus.CREATED,
        data: portfolio,
        message: 'Portfolio created successfully',
      };
    } catch (error) {
      this.logger.error(`Error creating portfolio: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /portfolios/summary - Get portfolio performance summary
   */
  @Get('summary/stats')
  async getPortfolioSummary(
    @Query('userId') userId: string
  ): Promise<ApiResponseDto<{
    totalPortfolios: number;
    totalValue: number;
    totalGain: number;
    totalGainPercentage: number;
    totalStocks: number;
  }>> {
    try {
      this.logger.log(`Getting portfolio summary for user: ${userId}`);
      
      if (!userId) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: null,
          message: 'User ID is required',
        };
      }

      const summary = await this.portfoliosService.getPortfolioSummary(userId);
      
      return {
        status: HttpStatus.OK,
        data: summary,
        message: 'Portfolio summary retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting portfolio summary: ${error.message}`, error.stack);
      throw error;
    }
  }
}
