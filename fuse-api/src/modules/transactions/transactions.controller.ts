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
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { 
  CreateTransactionDto, 
  TransactionDto, 
  ProcessTransactionDto 
} from './dto/transaction.dto';
import { ApiResponseDto, TransactionStatus } from '../../common/dto/common.dto';

@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * GET /transactions/:id - Get transaction by ID
   */
  @Get(':id')
  async getTransactionById(
    @Param('id') transactionId: string
  ): Promise<ApiResponseDto<TransactionDto>> {
    try {
      this.logger.log(`Getting transaction: ${transactionId}`);
      
      const transaction = await this.transactionsService.getTransactionById(transactionId);
      
      return {
        status: HttpStatus.OK,
        data: transaction,
        message: 'Transaction retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting transaction ${transactionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /transactions - Get user's transactions
   */
  @Get()
  async getUserTransactions(
    @Query('userId') userId: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string
  ): Promise<ApiResponseDto<TransactionDto[]>> {
    try {
      this.logger.log(`Getting transactions for user: ${userId}`);
      
      if (!userId) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: [],
          message: 'User ID is required',
        };
      }

      const limit = limitParam ? parseInt(limitParam, 10) : 50;
      const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

      const transactions = await this.transactionsService.getUserTransactions(
        userId, 
        limit, 
        offset
      );
      
      return {
        status: HttpStatus.OK,
        data: transactions,
        message: 'Transactions retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting user transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /transactions - Create new transaction (internal use)
   */
  @Post()
  async createTransaction(
    @Body(ValidationPipe) createTransactionDto: CreateTransactionDto
  ): Promise<ApiResponseDto<TransactionDto>> {
    try {
      this.logger.log(`Creating transaction for user: ${createTransactionDto.userId}`);
      
      const transaction = await this.transactionsService.createTransaction(createTransactionDto);
      
      return {
        status: HttpStatus.CREATED,
        data: transaction,
        message: 'Transaction created successfully',
      };
    } catch (error) {
      this.logger.error(`Error creating transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /transactions/:id/process - Update transaction status (internal use)
   */
  @Post(':id/process')
  async processTransaction(
    @Param('id') transactionId: string,
    @Body(ValidationPipe) processTransactionDto: ProcessTransactionDto
  ): Promise<ApiResponseDto<TransactionDto>> {
    try {
      this.logger.log(`Processing transaction: ${transactionId}`);
      
      const updatedTransaction = await this.transactionsService.updateTransactionStatus({
        ...processTransactionDto,
        transactionId,
      });
      
      return {
        status: HttpStatus.OK,
        data: updatedTransaction,
        message: 'Transaction processed successfully',
      };
    } catch (error) {
      this.logger.error(`Error processing transaction ${transactionId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /transactions/status/:status - Get transactions by status (internal use)
   */
  @Get('status/:status')
  async getTransactionsByStatus(
    @Param('status') status: TransactionStatus
  ): Promise<ApiResponseDto<TransactionDto[]>> {
    try {
      this.logger.log(`Getting transactions with status: ${status}`);
      
      const transactions = await this.transactionsService.getTransactionsByStatus(status);
      
      return {
        status: HttpStatus.OK,
        data: transactions,
        message: 'Transactions retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting transactions by status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /transactions/daily-stats - Get daily transaction statistics
   */
  @Get('daily-stats/:date')
  async getDailyStats(
    @Param('date') dateStr: string
  ): Promise<ApiResponseDto<{
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    totalVolume: number;
    totalValue: number;
  }>> {
    try {
      const date = new Date(dateStr);
      this.logger.log(`Getting daily stats for: ${date.toDateString()}`);
      
      const stats = await this.transactionsService.getDailyTransactionStats(date);
      
      return {
        status: HttpStatus.OK,
        data: stats,
        message: 'Daily statistics retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Error getting daily stats: ${error.message}`, error.stack);
      throw error;
    }
  }
}
