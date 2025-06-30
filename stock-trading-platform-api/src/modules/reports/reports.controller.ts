import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  HttpStatus, 
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DailyReportDto, EmailReportDto } from './dto/report.dto';
import { ApiResponseDto } from '../../common/dto/common.dto';

@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/daily - Generate daily report for specific date
   */
  @Get('daily')
  async getDailyReport(
    @Query('date') dateStr?: string
  ): Promise<ApiResponseDto<DailyReportDto>> {
    try {
      const date = dateStr ? new Date(dateStr) : new Date();
      this.logger.log(`Generating daily report for: ${date.toDateString()}`);
      
      const report = await this.reportsService.generateDailyReport(date);
      
      return {
        status: HttpStatus.OK,
        data: report,
        message: 'Daily report generated successfully',
      };
    } catch (error) {
      this.logger.error(`Error generating daily report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /reports/daily/send - Manually trigger daily report email
   */
  @Post('daily/send')
  async sendDailyReport(
    @Body(ValidationPipe) body: { 
      date?: string; 
      recipients: string[] 
    }
  ): Promise<ApiResponseDto<{ success: boolean; report: DailyReportDto }>> {
    try {
      const date = body.date ? new Date(body.date) : new Date();
      this.logger.log(`Manually sending daily report for: ${date.toDateString()}`);
      
      if (!body.recipients || body.recipients.length === 0) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: { success: false, report: null },
          message: 'Recipients list is required',
        };
      }

      const report = await this.reportsService.triggerDailyReport(date, body.recipients);
      
      return {
        status: HttpStatus.OK,
        data: { success: true, report },
        message: 'Daily report sent successfully',
      };
    } catch (error) {
      this.logger.error(`Error sending daily report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * GET /reports/test-email - Test email configuration
   */
  @Get('test-email')
  async testEmailConfiguration(): Promise<ApiResponseDto<{ valid: boolean }>> {
    try {
      this.logger.log('Testing email configuration');
      
      const isValid = await this.reportsService.testEmailConfiguration();
      
      return {
        status: HttpStatus.OK,
        data: { valid: isValid },
        message: isValid ? 'Email configuration is valid' : 'Email configuration is invalid',
      };
    } catch (error) {
      this.logger.error(`Error testing email configuration: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * POST /reports/trigger-cron - Manually trigger the cron job (for testing)
   */
  @Post('trigger-cron')
  async triggerCronJob(): Promise<ApiResponseDto<{ message: string }>> {
    try {
      this.logger.log('Manually triggering cron job');
      
      // Trigger the cron job method directly
      await this.reportsService.sendAutomaticDailyReport();
      
      return {
        status: HttpStatus.OK,
        data: { message: 'Cron job triggered successfully' },
        message: 'Automatic daily report triggered',
      };
    } catch (error) {
      this.logger.error(`Error triggering cron job: ${error.message}`, error.stack);
      throw error;
    }
  }
}
