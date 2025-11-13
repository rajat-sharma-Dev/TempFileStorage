# Temp File Storage - Backend

Backend server for temporary file storage with x402 crypto payments.

## Features

- 🔐 x402 Payment Integration (USDC on Base Sepolia)
- 📁 File Upload (up to 100MB)
- 🔗 Shareable Links
- ⏰ Auto-deletion on Expiry
- 💾 PostgreSQL Database
- 📊 Payment & Transaction Tracking

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- x402-compatible wallet with USDC

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   - `DB_*` - Your PostgreSQL credentials
   - `RECEIVER_WALLET_ADDRESS` - Your wallet address (already set)
   - Other settings as needed

3. **Setup PostgreSQL Database**
   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE temp_file_storage;
   \q
   ```

4. **Start Server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

The server will:
- Initialize database tables automatically
- Start on port 5000
- Begin file cleanup scheduler (runs hourly)

## API Endpoints

### Files
- `POST /api/files/upload` - Upload file with duration
- `GET /api/files/info/:shareLink` - Get file information
- `GET /api/files/all` - Get all files (admin)

### Payment
- `POST /api/payment/initiate` - Initiate payment
- `POST /api/payment/complete` - Complete payment
- `GET /api/payment/status/:fileId` - Get payment status

### Download
- `GET /api/download/:shareLink` - Download file (requires payment)

### Health
- `GET /api/health` - Health check
- `GET /` - API information

## Pricing

- 1 day: $0.05 USDC
- 7 days: $0.15 USDC
- 30 days: $0.25 USDC

## Database Schema

### Files Table
- File metadata, pricing, expiry dates, payment status

### Payments Table
- Payment records, transaction hashes, status

### Transactions Table
- Audit trail of all events

## File Cleanup

Files are automatically deleted after expiry:
- **Automatic**: Runs every hour via cron job
- **Manual**: Can be triggered via scheduler utility

## x402 Integration

The backend uses `x402-express` middleware to handle:
- Payment requirement on download endpoints
- Payment verification via facilitator
- Automatic 402 response handling

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Check database connection
psql -U postgres -d temp_file_storage
```

## Production Deployment

### Render.com Free Tier

⚠️ **Important**: Files stored in `/uploads` folder will be deleted on:
- Service restarts
- New deployments
- Container recreation

For production, consider using cloud storage (S3, R2, etc.)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | temp_file_storage |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `RECEIVER_WALLET_ADDRESS` | Your wallet address | 0xfc23834846a42ed1edc70f253cf1919c93eaba16 |
| `X402_NETWORK` | Payment network | base-sepolia |
| `X402_FACILITATOR_URL` | Facilitator URL | https://x402.org/facilitator |
| `FRONTEND_URL` | Frontend URL (CORS) | http://localhost:5173 |

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify credentials in .env
# Create database if not exists
psql -U postgres -c "CREATE DATABASE temp_file_storage;"
```

### Upload Issues
```bash
# Ensure uploads directory exists and has write permissions
mkdir -p uploads
chmod 755 uploads
```

## License

MIT
