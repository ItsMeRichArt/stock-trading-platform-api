import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getConfiguration } from './config/configuration';

// Database
import { DatabaseModule } from './database/database.module';

// Modules
import { StocksModule } from './modules/stocks/stocks.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [getConfiguration],
    }),
    
    // Schedule for cron jobs
    ScheduleModule.forRoot(),
    
    // HTTP client
    HttpModule,
    
    // Logging
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    
    // Database
    DatabaseModule,
    
    // Business modules
    StocksModule,
    PortfoliosModule,
    TransactionsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
