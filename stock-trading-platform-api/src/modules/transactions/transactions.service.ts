import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { 
  CreateTransactionDto, 
  TransactionDto, 
  ProcessTransactionDto 
} from './dto/transaction.dto';
import { TransactionStatus } from '../../common/dto/common.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new transaction record
   */
  async createTransaction(createTransactionDto: CreateTransactionDto): Promise<TransactionDto> {
    try {
      this.logger.log(`Creating transaction for user ${createTransactionDto.userId}`);

      const transaction = await this.prisma.transaction.create({
        data: {
          userId: createTransactionDto.userId,
          stockId: createTransactionDto.stockId,
          type: createTransactionDto.type,
          quantity: createTransactionDto.quantity,
          price: createTransactionDto.price,
          totalAmount: createTransactionDto.price * createTransactionDto.quantity,
          status: 'PENDING',
        },
        include: {
          stock: true,
          user: true,
        },
      });

      return {
        id: transaction.id,
        userId: transaction.userId,
        stockId: transaction.stockId,
        symbol: transaction.stock.symbol,
        type: transaction.type as any,
        quantity: transaction.quantity,
        price: transaction.price,
        total: transaction.totalAmount,
        status: transaction.status as any,
        errorMessage: transaction.errorMessage,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt,
      };

    } catch (error) {
      this.logger.error(`Error creating transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(processTransactionDto: ProcessTransactionDto): Promise<TransactionDto> {
    try {
      this.logger.log(`Updating transaction ${processTransactionDto.transactionId} to ${processTransactionDto.status}`);

      const transaction = await this.prisma.transaction.update({
        where: { id: processTransactionDto.transactionId },
        data: {
          status: processTransactionDto.status,
          errorMessage: processTransactionDto.errorMessage,
          processedAt: new Date(),
        },
        include: {
          stock: true,
          user: true,
        },
      });

      return {
        id: transaction.id,
        userId: transaction.userId,
        stockId: transaction.stockId,
        symbol: transaction.stock.symbol,
        type: transaction.type as any,
        quantity: transaction.quantity,
        price: transaction.price,
        total: transaction.totalAmount,
        status: transaction.status as any,
        errorMessage: transaction.errorMessage,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt,
      };

    } catch (error) {
      this.logger.error(`Error updating transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<TransactionDto> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          stock: true,
          user: true,
        },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      return {
        id: transaction.id,
        userId: transaction.userId,
        stockId: transaction.stockId,
        symbol: transaction.stock.symbol,
        type: transaction.type as any,
        quantity: transaction.quantity,
        price: transaction.price,
        total: transaction.totalAmount,
        status: transaction.status as any,
        errorMessage: transaction.errorMessage,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt,
      };

    } catch (error) {
      this.logger.error(`Error getting transaction ${transactionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user's transactions with pagination
   */
  async getUserTransactions(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<TransactionDto[]> {
    try {
      this.logger.log(`Getting transactions for user ${userId}`);

      const transactions = await this.prisma.transaction.findMany({
        where: { userId },
        include: {
          stock: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return transactions.map(transaction => ({
        id: transaction.id,
        userId: transaction.userId,
        stockId: transaction.stockId,
        symbol: transaction.stock.symbol,
        type: transaction.type as any,
        quantity: transaction.quantity,
        price: transaction.price,
        total: transaction.totalAmount,
        status: transaction.status as any,
        errorMessage: transaction.errorMessage,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt,
      }));

    } catch (error) {
      this.logger.error(`Error getting user transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get transactions by status
   */
  async getTransactionsByStatus(status: TransactionStatus): Promise<TransactionDto[]> {
    try {
      this.logger.log(`Getting transactions with status: ${status}`);

      const transactions = await this.prisma.transaction.findMany({
        where: { status },
        include: {
          stock: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return transactions.map(transaction => ({
        id: transaction.id,
        userId: transaction.userId,
        stockId: transaction.stockId,
        symbol: transaction.stock.symbol,
        type: transaction.type as any,
        quantity: transaction.quantity,
        price: transaction.price,
        total: transaction.totalAmount,
        status: transaction.status as any,
        errorMessage: transaction.errorMessage,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt,
      }));

    } catch (error) {
      this.logger.error(`Error getting transactions by status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get transactions for date range (for daily reports)
   */
  async getTransactionsForDateRange(
    startDate: Date, 
    endDate: Date
  ): Promise<{
    successful: TransactionDto[];
    failed: TransactionDto[];
    pending: TransactionDto[];
  }> {
    try {
      this.logger.log(`Getting transactions between ${startDate.toISOString()} and ${endDate.toISOString()}`);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          stock: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const mappedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        userId: transaction.userId,
        stockId: transaction.stockId,
        symbol: transaction.stock.symbol,
        type: transaction.type as any,
        quantity: transaction.quantity,
        price: transaction.price,
        total: transaction.totalAmount,
        status: transaction.status as any,
        errorMessage: transaction.errorMessage,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt,
      }));

      return {
        successful: mappedTransactions.filter(t => t.status === TransactionStatus.SUCCESS),
        failed: mappedTransactions.filter(t => t.status === TransactionStatus.FAILED),
        pending: mappedTransactions.filter(t => t.status === TransactionStatus.PENDING),
      };

    } catch (error) {
      this.logger.error(`Error getting transactions for date range: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get daily transaction statistics
   */
  async getDailyTransactionStats(date: Date): Promise<{
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    totalVolume: number;
    totalValue: number;
  }> {
    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const transactions = await this.getTransactionsForDateRange(startOfDay, endOfDay);

      const allTransactions = [
        ...transactions.successful,
        ...transactions.failed,
        ...transactions.pending,
      ];

      const stats = {
        totalTransactions: allTransactions.length,
        successfulTransactions: transactions.successful.length,
        failedTransactions: transactions.failed.length,
        pendingTransactions: transactions.pending.length,
        totalVolume: allTransactions.reduce((sum, t) => sum + t.quantity, 0),
        totalValue: transactions.successful.reduce((sum, t) => sum + t.total, 0),
      };

      this.logger.log(`Daily stats for ${date.toDateString()}: ${JSON.stringify(stats)}`);
      return stats;

    } catch (error) {
      this.logger.error(`Error getting daily transaction stats: ${error.message}`, error.stack);
      throw error;
    }
  }
}
