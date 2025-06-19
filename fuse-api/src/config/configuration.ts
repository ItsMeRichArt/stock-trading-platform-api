import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
}

export interface VendorApiConfig {
  baseUrl: string;
  apiKey: string;
  retryAttempts: number;
  retryDelay: number;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  dailyReportCron: string;
}

export const getConfiguration = () => ({
  database: {
    url: process.env.DATABASE_URL,
  } as DatabaseConfig,
  
  vendorApi: {
    baseUrl: process.env.VENDOR_API_BASE_URL,
    apiKey: process.env.VENDOR_API_KEY,
    retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.API_RETRY_DELAY) || 1000,
  } as VendorApiConfig,
  
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  } as EmailConfig,
  
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    dailyReportCron: process.env.DAILY_REPORT_CRON || '0 9 * * *',
  } as AppConfig,
});

export type Configuration = ReturnType<typeof getConfiguration>;
