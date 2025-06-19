# Fuse Trading API

A backend service for stock trading operations that integrates with Fuse's mock API to list available stocks, manage user portfolios, and execute purchase transactions.

## 🚀 Features

- **Stock listing** available with pagination
- **User portfolio management** with real-time calculations
- **Purchase execution** with price validation (±2%)
- **Automatic daily reports** via email
- **Retry logic** for unreliable APIs
- **Complete logging** with Winston
- **Robust validation** with class-validator
- **PostgreSQL database** with Prisma ORM

## 📋 Requirements

- Node.js 20+ 
- Docker & Docker Compose
- PostgreSQL (or use Docker)

## 🛠️ Installation

### 1. Clone repository
```bash
git clone <repository-url>
cd fuse-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Variables are already configured in `.env`, but you can adjust them:

**Main variables:**
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fuse_trading?schema=public"

# Vendor API
VENDOR_API_BASE_URL="https://api.challenge.fusefinance.com"
VENDOR_API_KEY="nSbPbFJfe95BFZufiDwF32UhqZLEVQ5K4wdtJI2e"

# Email configuration (for reports)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@fusetrading.com"

# Daily reports
DAILY_REPORT_CRON="0 9 * * *"  # 9:00 AM every day
DAILY_REPORT_RECIPIENTS="admin@fusetrading.com"
```

### 4. Start database with Docker
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 5. Run migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start server
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 🐳 Docker (Alternative option)

### Run everything with Docker
```bash
docker-compose up --build
```

## 📡 API Endpoints

API is available at `http://localhost:3000/api/v1`

### 📈 Stocks
- **GET** `/stocks` - List available stocks
- **GET** `/stocks/:symbol` - Get specific stock  
- **POST** `/stocks/:symbol/buy` - Buy stock

### 💼 Portfolios
- **GET** `/portfolios?userId={id}` - Get user portfolios
- **GET** `/portfolios/:id?userId={id}` - Get specific portfolio
- **POST** `/portfolios` - Create new portfolio
- **GET** `/portfolios/summary/stats?userId={id}` - General statistics

### 📊 Transactions
- **GET** `/transactions?userId={id}` - Get user transactions
- **GET** `/transactions/:id` - Get specific transaction

### 📧 Reports
- **GET** `/reports/daily?date={YYYY-MM-DD}` - Generate daily report
- **POST** `/reports/daily/send` - Send report via email
- **GET** `/reports/test-email` - Test email configuration

## 🧪 Quick Tests

### 1. List available stocks
```bash
curl -X GET "http://localhost:3000/api/v1/stocks"
```

### 2. Buy stock
```bash
curl -X POST "http://localhost:3000/api/v1/stocks/AAPL/buy?userId=user123" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 150.00,
    "quantity": 10
  }'
```

### 3. View portfolio
```bash
curl -X GET "http://localhost:3000/api/v1/portfolios?userId=user123"
```

### 4. Generate daily report
```bash
curl -X GET "http://localhost:3000/api/v1/reports/daily"
```

## 🏗️ Architecture

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: class-validator + class-transformer
- **HTTP Client**: Axios with retry logic
- **Scheduling**: @nestjs/schedule for cron jobs
- **Email**: Nodemailer
- **Logging**: Winston
- **Containerization**: Docker

## 📁 Project structure

```
src/
├── modules/
│   ├── stocks/           # Stock management
│   ├── portfolios/       # Portfolio management
│   ├── transactions/     # Transaction management
│   └── reports/          # Reports and emails
├── common/
│   ├── dto/             # Data Transfer Objects
│   ├── filters/         # Exception filters
│   └── interceptors/    # Request/Response interceptors
├── config/              # Configuration
├── database/            # Prisma configuration
└── main.ts             # Entry point
```

## 🚀 Implemented Features

### ✅ The 3 required endpoints:
1. **GET /stocks** - Lists available stocks with pagination
2. **GET /portfolios** - Gets user portfolios 
3. **POST /stocks/:symbol/buy** - Executes stock purchases

### ✅ Daily email report:
- Automatic cron job at 9:00 AM
- HTML email with complete statistics
- Successful and failed transactions
- Manual endpoint to generate reports

### ✅ Additional features:
- Retry logic for unreliable vendor API
- Price validation with 2% tolerance
- Stock cache updated every 5 minutes
- Complete logging with Winston
- Global exception handling
- Robust data validation

## 📄 License

This project is private and confidential.
