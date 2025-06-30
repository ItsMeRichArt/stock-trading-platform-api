import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { TransactionsService } from '../transactions/transactions.service';
import { DailyReportDto, EmailReportDto } from './dto/report.dto';
import { EmailConfig, AppConfig } from '../../config/configuration';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly emailConfig: EmailConfig;
  private readonly appConfig: AppConfig;
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionsService: TransactionsService,
  ) {
    this.emailConfig = this.configService.get<EmailConfig>('email');
    this.appConfig = this.configService.get<AppConfig>('app');
    this.initializeEmailTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeEmailTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.emailConfig.host,
        port: this.emailConfig.port,
        secure: this.emailConfig.secure,
        auth: {
          user: this.emailConfig.user,
          pass: this.emailConfig.pass,
        },
      });

      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize email transporter: ${error.message}`, error.stack);
    }
  }

  /**
   * Generate daily report for a specific date
   */
  async generateDailyReport(date: Date = new Date()): Promise<DailyReportDto> {
    try {
      this.logger.log(`Generating daily report for ${date.toDateString()}`);

      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      // Get all transactions for the day
      const transactionData = await this.transactionsService.getTransactionsForDateRange(
        startOfDay,
        endOfDay
      );

      // Calculate totals
      const totalSuccessfulTransactions = transactionData.successful.length;
      const totalFailedTransactions = transactionData.failed.length;
      const totalVolume = [
        ...transactionData.successful,
        ...transactionData.failed,
        ...transactionData.pending,
      ].reduce((sum, t) => sum + t.quantity, 0);

      const totalValue = transactionData.successful.reduce((sum, t) => sum + t.total, 0);

      const report: DailyReportDto = {
        date,
        totalSuccessfulTransactions,
        totalFailedTransactions,
        totalVolume,
        totalValue,
        successfulTransactions: transactionData.successful,
        failedTransactions: transactionData.failed,
      };

      this.logger.log(`Daily report generated: ${totalSuccessfulTransactions} successful, ${totalFailedTransactions} failed transactions`);
      return report;

    } catch (error) {
      this.logger.error(`Error generating daily report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate HTML email content for daily report
   */
  private generateReportEmailHTML(report: DailyReportDto): string {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Trading Report</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
        .success { color: #27ae60; }
        .error { color: #e74c3c; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #3498db; color: white; }
        .table tr:hover { background: #f5f5f5; }
        .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #2c3e50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 Daily Trading Report</h1>
            <p>${formatDate(report.date)}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="stat-card">
                    <div class="stat-number success">${report.totalSuccessfulTransactions}</div>
                    <div class="stat-label">Successful Transactions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number error">${report.totalFailedTransactions}</div>
                    <div class="stat-label">Failed Transactions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${report.totalVolume.toLocaleString()}</div>
                    <div class="stat-label">Total Volume (Shares)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${formatCurrency(report.totalValue)}</div>
                    <div class="stat-label">Total Transaction Value</div>
                </div>
            </div>

            ${report.successfulTransactions.length > 0 ? `
            <div class="section-title success">✅ Successful Transactions (${report.successfulTransactions.length})</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Stock</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.successfulTransactions.map(t => `
                    <tr>
                        <td>${t.createdAt.toLocaleTimeString()}</td>
                        <td>${t.symbol}</td>
                        <td>${t.type}</td>
                        <td>${t.quantity}</td>
                        <td>${formatCurrency(t.price)}</td>
                        <td>${formatCurrency(t.total)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<div class="section-title">✅ No successful transactions today</div>'}

            ${report.failedTransactions.length > 0 ? `
            <div class="section-title error">❌ Failed Transactions (${report.failedTransactions.length})</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Stock</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.failedTransactions.map(t => `
                    <tr>
                        <td>${t.createdAt.toLocaleTimeString()}</td>
                        <td>${t.symbol}</td>
                        <td>${t.type}</td>
                        <td>${t.quantity}</td>
                        <td>${formatCurrency(t.price)}</td>
                        <td>${t.errorMessage || 'Unknown error'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<div class="section-title">✅ No failed transactions today</div>'}

            <div style="margin-top: 30px; padding: 15px; background: #e8f4f8; border-radius: 8px; text-align: center;">
                <p><strong>Fuse Trading Platform</strong></p>
                <p style="font-size: 12px; color: #666;">This is an automated daily report generated at ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email content for daily report
   */
  private generateReportEmailText(report: DailyReportDto): string {
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatDate = (date: Date) => date.toDateString();

    let text = `
DAILY TRADING REPORT - ${formatDate(report.date)}
${'='.repeat(50)}

SUMMARY:
- Successful Transactions: ${report.totalSuccessfulTransactions}
- Failed Transactions: ${report.totalFailedTransactions}
- Total Volume: ${report.totalVolume} shares
- Total Transaction Value: ${formatCurrency(report.totalValue)}

`;

    if (report.successfulTransactions.length > 0) {
      text += `
SUCCESSFUL TRANSACTIONS (${report.successfulTransactions.length}):
${'-'.repeat(50)}
`;
      report.successfulTransactions.forEach(t => {
        text += `${t.createdAt.toLocaleTimeString()} | ${t.symbol} | ${t.type} | ${t.quantity} shares @ ${formatCurrency(t.price)} = ${formatCurrency(t.total)}\n`;
      });
    }

    if (report.failedTransactions.length > 0) {
      text += `
FAILED TRANSACTIONS (${report.failedTransactions.length}):
${'-'.repeat(50)}
`;
      report.failedTransactions.forEach(t => {
        text += `${t.createdAt.toLocaleTimeString()} | ${t.symbol} | ${t.type} | ${t.quantity} shares @ ${formatCurrency(t.price)} | Error: ${t.errorMessage || 'Unknown'}\n`;
      });
    }

    text += `
${'='.repeat(50)}
Generated at: ${new Date().toLocaleString()}
Fuse Trading Platform
`;

    return text;
  }

  /**
   * Send daily report via email
   */
  async sendDailyReport(report: DailyReportDto, recipients: string[]): Promise<boolean> {
    try {
      this.logger.log(`Sending daily report to ${recipients.length} recipients`);

      const emailData: EmailReportDto = {
        to: recipients.join(', '),
        subject: `Daily Trading Report - ${report.date.toDateString()}`,
        htmlContent: this.generateReportEmailHTML(report),
        textContent: this.generateReportEmailText(report),
      };

      const mailOptions = {
        from: this.emailConfig.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Daily report sent successfully. Message ID: ${result.messageId}`);
      
      return true;

    } catch (error) {
      this.logger.error(`Failed to send daily report: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Cron job to send daily reports automatically
   * Runs every day at 9:00 AM (configurable via environment variable)
   * Temporarily disabled due to crypto polyfill issue
   */
  // @Cron(process.env.DAILY_REPORT_CRON || '0 9 * * *')
  async sendAutomaticDailyReport(): Promise<void> {
    try {
      this.logger.log('Starting automatic daily report generation and sending');

      // Generate report for yesterday (complete day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const report = await this.generateDailyReport(yesterday);

      // In a real application, you would have a list of admin emails
      // For now, we'll use a configurable email list
      const recipients = process.env.DAILY_REPORT_RECIPIENTS?.split(',') || ['admin@fusetrading.com'];

      const success = await this.sendDailyReport(report, recipients);

      if (success) {
        this.logger.log('Automatic daily report sent successfully');
      } else {
        this.logger.error('Failed to send automatic daily report');
      }

    } catch (error) {
      this.logger.error(`Error in automatic daily report: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual trigger for daily report (for testing or manual runs)
   */
  async triggerDailyReport(date?: Date, recipients?: string[]): Promise<DailyReportDto> {
    try {
      const reportDate = date || new Date();
      const report = await this.generateDailyReport(reportDate);

      if (recipients && recipients.length > 0) {
        await this.sendDailyReport(report, recipients);
      }

      return report;

    } catch (error) {
      this.logger.error(`Error in manual daily report trigger: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      this.logger.log('Testing email configuration');

      const testResult = await this.transporter.verify();
      
      if (testResult) {
        this.logger.log('Email configuration is valid');
        return true;
      } else {
        this.logger.error('Email configuration is invalid');
        return false;
      }

    } catch (error) {
      this.logger.error(`Email configuration test failed: ${error.message}`, error.stack);
      return false;
    }
  }
}
