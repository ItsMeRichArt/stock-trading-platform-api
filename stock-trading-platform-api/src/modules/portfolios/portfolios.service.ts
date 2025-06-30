import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StocksService } from '../stocks/stocks.service';
import { 
  PortfolioDto, 
  PortfolioStockDto, 
  CreatePortfolioDto 
} from './dto/portfolio.dto';

@Injectable()
export class PortfoliosService {
  private readonly logger = new Logger(PortfoliosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stocksService: StocksService,
  ) {}

  /**
   * Get user's portfolios with current stock prices and calculations
   */
  async getUserPortfolios(userId: string): Promise<PortfolioDto[]> {
    try {
      this.logger.log(`Getting portfolios for user: ${userId}`);

      const portfolios = await this.prisma.portfolio.findMany({
        where: { userId },
        include: {
          stocks: {
            include: {
              stock: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const portfolioDtos: PortfolioDto[] = [];

      for (const portfolio of portfolios) {
        const portfolioStocks: PortfolioStockDto[] = [];
        let totalValue = 0;
        let totalCost = 0;

        for (const portfolioStock of portfolio.stocks) {
          // Get current stock price
          const currentStock = await this.stocksService.getStockBySymbol(
            portfolioStock.stock.symbol
          );

          if (currentStock) {
            const currentPrice = currentStock.price;
            const quantity = portfolioStock.quantity;
            const averagePrice = portfolioStock.averagePrice;
            const totalStockValue = currentPrice * quantity;
            const totalStockCost = averagePrice * quantity;
            const gain = totalStockValue - totalStockCost;
            const gainPercentage = totalStockCost > 0 ? (gain / totalStockCost) * 100 : 0;

            portfolioStocks.push({
              stockId: portfolioStock.stockId,
              symbol: portfolioStock.stock.symbol,
              name: portfolioStock.stock.name,
              quantity,
              averagePrice,
              currentPrice,
              totalValue: totalStockValue,
              gain,
              gainPercentage,
            });

            totalValue += totalStockValue;
            totalCost += totalStockCost;
          }
        }

        const totalGain = totalValue - totalCost;
        const totalGainPercentage = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

        portfolioDtos.push({
          id: portfolio.id,
          userId: portfolio.userId,
          name: portfolio.name,
          stocks: portfolioStocks,
          totalValue,
          totalGain,
          totalGainPercentage,
          createdAt: portfolio.createdAt,
          updatedAt: portfolio.updatedAt,
        });
      }

      this.logger.log(`Found ${portfolioDtos.length} portfolios for user ${userId}`);
      return portfolioDtos;

    } catch (error) {
      this.logger.error(`Error getting portfolios for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get specific portfolio by ID
   */
  async getPortfolioById(portfolioId: string, userId: string): Promise<PortfolioDto> {
    try {
      this.logger.log(`Getting portfolio ${portfolioId} for user ${userId}`);

      const portfolio = await this.prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          userId, // Ensure user can only access their own portfolios
        },
        include: {
          stocks: {
            include: {
              stock: true,
            },
          },
        },
      });

      if (!portfolio) {
        throw new NotFoundException(`Portfolio ${portfolioId} not found`);
      }

      const portfolioStocks: PortfolioStockDto[] = [];
      let totalValue = 0;
      let totalCost = 0;

      for (const portfolioStock of portfolio.stocks) {
        // Get current stock price
        const currentStock = await this.stocksService.getStockBySymbol(
          portfolioStock.stock.symbol
        );

        if (currentStock) {
          const currentPrice = currentStock.price;
          const quantity = portfolioStock.quantity;
          const averagePrice = portfolioStock.averagePrice;
          const totalStockValue = currentPrice * quantity;
          const totalStockCost = averagePrice * quantity;
          const gain = totalStockValue - totalStockCost;
          const gainPercentage = totalStockCost > 0 ? (gain / totalStockCost) * 100 : 0;

          portfolioStocks.push({
            stockId: portfolioStock.stockId,
            symbol: portfolioStock.stock.symbol,
            name: portfolioStock.stock.name,
            quantity,
            averagePrice,
            currentPrice,
            totalValue: totalStockValue,
            gain,
            gainPercentage,
          });

          totalValue += totalStockValue;
          totalCost += totalStockCost;
        }
      }

      const totalGain = totalValue - totalCost;
      const totalGainPercentage = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

      return {
        id: portfolio.id,
        userId: portfolio.userId,
        name: portfolio.name,
        stocks: portfolioStocks,
        totalValue,
        totalGain,
        totalGainPercentage,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
      };

    } catch (error) {
      this.logger.error(`Error getting portfolio ${portfolioId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a new portfolio for user
   */
  async createPortfolio(createPortfolioDto: CreatePortfolioDto): Promise<PortfolioDto> {
    try {
      this.logger.log(`Creating portfolio for user: ${createPortfolioDto.userId}`);

      const portfolio = await this.prisma.portfolio.create({
        data: {
          userId: createPortfolioDto.userId,
          name: createPortfolioDto.name || 'Default Portfolio',
        },
      });

      return {
        id: portfolio.id,
        userId: portfolio.userId,
        name: portfolio.name,
        stocks: [],
        totalValue: 0,
        totalGain: 0,
        totalGainPercentage: 0,
        createdAt: portfolio.createdAt,
        updatedAt: portfolio.updatedAt,
      };

    } catch (error) {
      this.logger.error(`Error creating portfolio: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get or create user's default portfolio
   */
  async getOrCreateDefaultPortfolio(userId: string): Promise<PortfolioDto> {
    try {
      const portfolios = await this.getUserPortfolios(userId);
      
      if (portfolios.length > 0) {
        return portfolios[0]; // Return first portfolio as default
      }

      // Create default portfolio if none exists
      return this.createPortfolio({
        userId,
        name: 'Default Portfolio',
      });

    } catch (error) {
      this.logger.error(`Error getting/creating default portfolio for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get portfolio performance summary
   */
  async getPortfolioSummary(userId: string): Promise<{
    totalPortfolios: number;
    totalValue: number;
    totalGain: number;
    totalGainPercentage: number;
    totalStocks: number;
  }> {
    try {
      this.logger.log(`Getting portfolio summary for user: ${userId}`);

      const portfolios = await this.getUserPortfolios(userId);
      
      const summary = portfolios.reduce(
        (acc, portfolio) => ({
          totalPortfolios: acc.totalPortfolios + 1,
          totalValue: acc.totalValue + portfolio.totalValue,
          totalGain: acc.totalGain + portfolio.totalGain,
          totalStocks: acc.totalStocks + portfolio.stocks.length,
        }),
        {
          totalPortfolios: 0,
          totalValue: 0,
          totalGain: 0,
          totalStocks: 0,
        }
      );

      const totalGainPercentage = summary.totalValue > 0 
        ? ((summary.totalGain / (summary.totalValue - summary.totalGain)) * 100) 
        : 0;

      return {
        ...summary,
        totalGainPercentage,
      };

    } catch (error) {
      this.logger.error(`Error getting portfolio summary for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
