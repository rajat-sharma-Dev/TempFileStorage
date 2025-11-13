# Temp File Storage

A full-stack application for temporary file storage with cryptocurrency payments via x402 protocol.

## 🚀 Features

- 📤 **File Upload**: Upload files up to 100MB
- 💰 **Crypto Payments**: Pay with USDC on Base Sepolia via x402
- 🔗 **Shareable Links**: Get unique links for your files
- ⏰ **Auto-Delete**: Files automatically deleted after expiry
- 🎨 **Modern UI**: Beautiful React interface with Tailwind CSS
- 🔐 **Secure**: Payment verification and transaction tracking

## 📋 Pricing

| Duration | Price |
|----------|-------|
| 1 Day    | $0.05 USDC |
| 7 Days   | $0.15 USDC |
| 30 Days  | $0.25 USDC |

## 🏗️ Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios
- React Hot Toast
- Lucide Icons

### Backend
- Node.js
- Express
- PostgreSQL
- x402-express (Payment middleware)
- Multer (File upload)
- Node-cron (Scheduled tasks)

## 📦 Project Structure

```
new5/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
├── backend/           # Node.js backend
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- x402-compatible wallet with USDC (Base Sepolia testnet)

### 1. Clone & Setup

```bash
cd /Users/rajatsharma/Desktop/new5
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup PostgreSQL database
psql -U postgres
CREATE DATABASE temp_file_storage;
\q

# Configure environment (update .env with your database credentials)
# The wallet address is already configured: 0xfc23834846a42ed1edc70f253cf1919c93eaba16

# Start backend server
npm run dev
```

Backend will run on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 📝 Usage Flow

1. **Upload File**
   - Visit `http://localhost:5173`
   - Drag & drop or browse to select file (max 100MB)
   - Choose storage duration (1, 7, or 30 days)
   - Click "Upload & Pay"

2. **Payment** (Coming Soon - x402 Integration)
   - System will prompt for payment
   - Connect your wallet (MetaMask, etc.)
   - Pay the required USDC amount
   - Transaction verified via x402 facilitator

3. **Share Link**
   - Get unique shareable link
   - Copy and share with anyone
   - Link expires after chosen duration

4. **Download**
   - Anyone with link can download (after payment)
   - Files auto-delete after expiry

## 🗄️ Database Schema

### Files Table
```sql
- id (UUID)
- filename
- original_filename
- filepath
- file_size
- mime_type
- duration_days
- price_usd
- share_link
- expiry_date
- payment_status
- created_at
- updated_at
```

### Payments Table
```sql
- id (UUID)
- file_id (FK)
- amount_usd
- payment_status
- transaction_hash
- payment_data (JSONB)
- paid_at
- created_at
```

### Transactions Table
```sql
- id (UUID)
- file_id (FK)
- payment_id (FK)
- event_type
- event_data (JSONB)
- created_at
```

## 🔌 API Endpoints

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/info/:shareLink` - Get file info
- `GET /api/files/all` - List all files

### Payment
- `POST /api/payment/initiate` - Initiate payment
- `POST /api/payment/complete` - Complete payment
- `GET /api/payment/status/:fileId` - Get payment status

### Download
- `GET /api/download/:shareLink` - Download file (payment required)

### System
- `GET /api/health` - Health check
- `GET /` - API info

## ⚙️ Configuration

### Backend (.env)
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=temp_file_storage
DB_USER=postgres
DB_PASSWORD=your_password
RECEIVER_WALLET_ADDRESS=0xfc23834846a42ed1edc70f253cf1919c93eaba16
X402_NETWORK=base-sepolia
X402_FACILITATOR_URL=https://x402.org/facilitator
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🔄 File Cleanup Scheduler

Files are automatically deleted after expiry:
- Runs every hour via cron job
- Deletes both physical files and database records
- Logs all deletions in transactions table

## 🛡️ Security Features

- ✅ File size validation (100MB limit)
- ✅ Payment verification via x402
- ✅ Secure file storage
- ✅ Auto-deletion on expiry
- ✅ Transaction logging
- ✅ CORS protection

## 🚧 Future Enhancements

- [ ] Web3 wallet authentication (RainbowKit)
- [ ] User dashboard
- [ ] Multiple file upload
- [ ] Cloud storage integration (S3, R2)
- [ ] Email notifications
- [ ] File encryption
- [ ] Rate limiting
- [ ] Admin panel

## ⚠️ Important Notes

### File Storage
- Files stored in `/uploads` folder (local filesystem)
- **On Render.com free tier**: Files will be deleted on restart/redeploy
- For production: Use cloud storage (AWS S3, Cloudflare R2, etc.)

### Payments
- Uses x402 protocol for crypto payments
- Base Sepolia testnet (testnet USDC)
- For mainnet: Update `X402_NETWORK` and facilitator

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Restart if needed
sudo service postgresql restart

# Verify database exists
psql -U postgres -l
```

### Upload Not Working
```bash
# Check uploads directory
ls -la backend/uploads

# Create if missing
mkdir -p backend/uploads
chmod 755 backend/uploads
```

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
- Clear browser cache
- Check both servers are running

### Payment Issues
- Verify wallet has USDC on Base Sepolia
- Check x402 facilitator URL
- Ensure wallet address is correct

## 📚 Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [x402 Documentation](https://x402.gitbook.io/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use this project for learning or production!

## 🙏 Acknowledgments

- x402 Protocol for crypto payment infrastructure
- Base Sepolia for testnet
- Coinbase for facilitator services

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Join x402 Discord: [discord.gg/invite/cdp](https://discord.gg/invite/cdp)

---

**Built with ❤️ using React, Node.js, PostgreSQL, and x402**
