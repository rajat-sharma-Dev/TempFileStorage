# 🚀 Temp File Storage with x402 Payment Protocol

A decentralized file storage application featuring **pay-per-upload** and **pay-per-download** using the **x402 payment protocol** with USDC on Base Sepolia testnet.

[![x402](https://img.shields.io/badge/x402-Payment%20Protocol-blue)](https://x402.org)
[![Base Sepolia](https://img.shields.io/badge/Base-Sepolia-0052FF)](https://base.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791)](https://neon.tech)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [x402 Protocol Integration](#-x402-protocol-integration)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture & Flow](#-architecture--flow)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Payment Flow Diagrams](#-payment-flow-diagrams)
- [Configuration](#️-configuration)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

This application demonstrates a complete implementation of the **Coinbase x402 payment protocol** for file storage services. Users pay with USDC cryptocurrency for both uploading and downloading files, with all payments verified on-chain via the Base Sepolia testnet.

### What is x402?

**x402** is a payment protocol that enables seamless cryptocurrency payments for HTTP resources. Similar to HTTP status code 402 (Payment Required), x402 automates:
- Payment requirement detection
- On-chain payment execution
- Payment verification
- Resource delivery after confirmation

### Key Highlights

✅ **Dual Payment Model**: Pay for upload (storage) AND download (access)  
✅ **Dynamic Pricing**: Different rates for 1, 7, or 30-day storage  
✅ **Automatic Payments**: x402 handles wallet connection and USDC transfers  
✅ **On-chain Verification**: All payments verified via Base Sepolia blockchain  
✅ **Serverless Database**: PostgreSQL on Neon with auto-scaling  
✅ **Production Ready**: Deployed backend on Render.com

---

## 💰 x402 Protocol Integration

### How x402 Works in This App

```
┌─────────────────────────────────────────────────────────────────┐
│                        x402 Payment Flow                         │
└─────────────────────────────────────────────────────────────────┘

1️⃣  User Action (Upload/Download)
    ↓
2️⃣  Backend Returns: 402 Payment Required
    {
      "x402Version": 1,
      "accepts": [{
        "scheme": "exact",
        "network": "base-sepolia",
        "maxAmountRequired": "50000",  // 0.05 USDC in micro-units
        "payTo": "0xbc86ca947ab27b990054870566cfe849c2109d2d",
        "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"  // USDC
      }]
    }
    ↓
3️⃣  Frontend x402 Client:
    - Connects wallet (RainbowKit + wagmi)
    - Checks USDC balance
    - Creates payment transaction
    - Signs with EIP-712 authorization
    - Sends USDC to receiver
    ↓
4️⃣  Frontend Retries with X-Payment Header:
    X-Payment: <base64-encoded-payment-proof>
    ↓
5️⃣  Backend Verifies:
    - Decodes payment proof
    - Validates on-chain transaction
    - Checks amount and receiver
    - Verifies via x402 Facilitator (x402.org)
    ↓
6️⃣  ✅ Payment Confirmed → Resource Delivered
```

### x402 Components Used

| Component | Purpose | Location |
|-----------|---------|----------|
| **x402 Client** | Frontend payment handling | `frontend/src/services/x402Service.js` |
| **x402 Helpers** | Backend verification | `backend/utils/x402Helpers.js` |
| **x402 Middleware** | Download endpoint protection | `backend/routes/downloadRoutes.js` |
| **x402 Facilitator** | On-chain verification service | `https://x402.org/facilitator` |

---

## 🚀 Features

### 💳 Payment Features
- **Pay-per-Upload**: Storage fees based on duration (1/7/30 days)
- **Pay-per-Download**: Access fees for file retrieval
- **Dynamic Pricing**: Real-time price calculation
- **USDC Payments**: Stable cryptocurrency on Base Sepolia
- **Wallet Integration**: RainbowKit for easy wallet connection
- **On-chain Verification**: All payments verified on blockchain

### 📁 File Management
- **Large Files**: Support up to 100MB
- **Temporary Storage**: Auto-delete after expiry
- **Shareable Links**: Unique URLs for each file
- **Direct Downloads**: Backend serves files with payment verification
- **File Metadata**: Track size, type, upload date, expiry

### 🔐 Security & Reliability
- **Payment Verification**: x402 protocol ensures valid payments
- **Transaction Logging**: Complete audit trail
- **Serverless Database**: PostgreSQL on Neon (auto-scaling)
- **SSL/TLS**: Secure connections required
- **CORS Protection**: Configured for production

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **wagmi** - Ethereum React hooks
- **viem** - Ethereum client library
- **RainbowKit** - Wallet connection UI
- **x402 Client** - Payment protocol implementation
- **React Hot Toast** - Notifications
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js 18+** - Runtime
- **Express** - Web framework
- **PostgreSQL (Neon)** - Serverless database
- **x402 SDK** - Payment verification
- **Multer** - File upload handling
- **node-cron** - Scheduled file cleanup
- **dotenv** - Environment configuration

### Blockchain & Payments
- **Base Sepolia** - L2 testnet
- **USDC** - Stablecoin (testnet)
- **x402 Protocol** - Payment standard
- **x402 Facilitator** - Payment verification service

---

## 🏗 Architecture & Flow

### System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         User's Browser                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Frontend (React + Vite)                                  │   │
│  │  - RainbowKit Wallet UI                                   │   │
│  │  - x402 Client (Payment Handling)                         │   │
│  │  - File Upload/Download Components                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            │ x402 Payment Headers
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes                                               │   │
│  │  - POST /api/files/upload (x402 protected)               │   │
│  │  - GET  /api/download/:link (x402 middleware)            │   │
│  │  - GET  /api/files/info/:link                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  x402 Verification System                                │   │
│  │  - Parse payment headers                                 │   │
│  │  - Decode payment proofs                                 │   │
│  │  - Verify with facilitator                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ↓           ↓           ↓
    ┌────────────────┐ ┌─────────────┐ ┌──────────────────┐
    │   PostgreSQL   │ │ File System │ │  x402 Facilitator│
    │  (Neon Cloud)  │ │  (Uploads)  │ │  (x402.org)      │
    │                │ │             │ │                  │
    │  - Files DB    │ │  - 100MB    │ │  - Verify txs    │
    │  - Payments DB │ │  - Auto-    │ │  - On-chain      │
    │  - Txs DB      │ │    cleanup  │ │    validation    │
    └────────────────┘ └─────────────┘ └──────────────────┘
```

### Complete Upload Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant W as Wallet
    participant B as Backend
    participant X as x402 Facilitator
    participant BC as Blockchain
    participant DB as PostgreSQL

    U->>F: Select file & duration
    U->>F: Click "Pay & Upload"
    F->>W: Request wallet connection
    W->>F: Connected (address)
    
    F->>B: POST /api/files/upload
    Note over F,B: No X-Payment header
    
    B->>B: Calculate price ($0.05-$0.25)
    B->>B: Create payment requirements
    B->>F: 402 Payment Required
    Note over B,F: Returns x402 payment info
    
    F->>F: Parse payment requirements
    F->>W: Check USDC balance
    W->>F: Balance confirmed
    
    F->>W: Request payment signature
    U->>W: Approve transaction
    W->>BC: Transfer USDC
    BC->>W: Transaction confirmed
    
    F->>F: Create payment proof
    F->>F: Encode with x402 client
    
    F->>B: POST /api/files/upload (retry)
    Note over F,B: With X-Payment header
    
    B->>B: Decode payment proof
    B->>X: Verify payment
    X->>BC: Check on-chain transaction
    BC->>X: Transaction valid
    X->>B: Verification success
    
    B->>DB: Save file metadata
    B->>DB: Log payment
    B->>DB: Log transaction
    
    B->>F: 201 Created
    Note over B,F: Returns file info & share link
    
    F->>U: Show success & shareable link
```

### Complete Download Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant W as Wallet
    participant B as Backend
    participant X as x402 Facilitator
    participant BC as Blockchain
    participant FS as File System

    U->>F: Click shareable link
    F->>B: GET /api/download/:link
    Note over F,B: No X-Payment header
    
    B->>B: Check if file exists
    B->>B: x402 middleware activated
    B->>F: 402 Payment Required
    Note over B,F: Returns payment requirements
    
    F->>W: Check USDC balance
    W->>F: Balance confirmed
    
    F->>W: Request payment signature
    U->>W: Approve download payment
    W->>BC: Transfer USDC
    BC->>W: Transaction confirmed
    
    F->>F: Create payment proof
    F->>B: GET /api/download/:link (retry)
    Note over F,B: With X-Payment header
    
    B->>B: Decode payment proof
    B->>X: Verify payment
    X->>BC: Check transaction
    BC->>X: Valid
    X->>B: Verified
    
    B->>FS: Read file
    FS->>B: File data
    
    B->>F: 200 OK + File Blob
    F->>U: Download file to device
```

---

## 📋 Pricing

| Duration | Upload Fee | Download Fee | Total Cost |
|----------|------------|--------------|------------|
| 1 Day    | $0.05 USDC | $0.05 USDC*  | $0.10 USDC |
| 7 Days   | $0.15 USDC | $0.15 USDC*  | $0.30 USDC |
| 30 Days  | $0.25 USDC | $0.25 USDC*  | $0.50 USDC |

*Download fee applies per download via x402 protocol

---

## 🚀 Quick Start
---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** (local) OR **Neon account** (cloud)
- **Crypto Wallet** with Base Sepolia USDC (get testnet USDC from [faucet](https://www.base.org/faucets))
- **Git** (to clone the repository)

### Installation

#### 1. Clone the Repository

```bash
cd ~/Desktop
git clone <your-repo-url>
cd new5
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# OR create manually:
nano .env
```

**Configure `.env` file:**

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration (Choose Local OR Neon)

# Option A: Local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=temp_file_storage
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_SSL=false

# Option B: Neon PostgreSQL (Recommended for production)
# DB_HOST=your-neon-endpoint.neon.tech
# DB_PORT=5432
# DB_NAME=temp_file_storage
# DB_USER=neondb_owner
# DB_PASSWORD=your_neon_password
# DB_SSL=true

# x402 Configuration
RECEIVER_WALLET_ADDRESS=0xbc86ca947ab27b990054870566cfe849c2109d2d
X402_NETWORK=base-sepolia
X402_FACILITATOR_URL=https://x402.org/facilitator

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**If using local PostgreSQL, create database:**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE temp_file_storage;

# Exit
\q
```

**Start the backend:**

```bash
npm run dev
```

Expected output:
```
✅ Connected to PostgreSQL database
✅ Database connection successful
✅ Database tables initialized successfully
🚀 Server is running on port 5001
💰 x402 Payment Network: base-sepolia
```

Backend runs at: `http://localhost:5001`

#### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
nano .env
```

**Configure frontend `.env`:**

```env
# API URL (local backend)
VITE_API_URL=http://localhost:5001/api

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Receiver wallet address (should match backend)
VITE_RECEIVER_WALLET_ADDRESS=0xbc86ca947ab27b990054870566cfe849c2109d2d
```

**Start the frontend:**

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Frontend runs at: `http://localhost:5173`

#### 4. Test the Application

1. **Open browser**: Navigate to `http://localhost:5173`
2. **Connect wallet**: Click "Connect Wallet" button (use MetaMask or any Web3 wallet)
3. **Switch to Base Sepolia**: Ensure wallet is on Base Sepolia testnet
4. **Get testnet USDC**: Visit [Base faucet](https://www.base.org/faucets) if needed
5. **Upload a file**:
   - Select file (max 100MB)
   - Choose duration (1, 7, or 30 days)
   - Click "Pay & Upload"
   - Approve USDC payment in wallet
   - Wait for confirmation
6. **Get shareable link**: Copy the generated link
7. **Test download**: Paste link in new tab, pay download fee, file downloads

---

## 📁 Project Structure

```
new5/
├── README.md                          # This file
├── NEON_DEPLOYMENT_GUIDE.md          # Neon PostgreSQL setup guide
├── X402_INTEGRATION_COMPLETE.md      # x402 implementation details
├── SHAREABLE_LINK_FIX.md             # Link generation documentation
│
├── frontend/                          # React frontend application
│   ├── package.json                  # Frontend dependencies
│   ├── vite.config.js                # Vite configuration
│   ├── tailwind.config.js            # Tailwind CSS config
│   ├── .env                          # Frontend environment variables
│   │
│   └── src/
│       ├── App.jsx                   # Main app component
│       ├── main.jsx                  # Entry point
│       │
│       ├── components/
│       │   ├── FileUpload.jsx        # Upload UI with x402 payment
│       │   ├── PaymentSuccess.jsx    # Success screen with shareable link
│       │   ├── Hero.jsx              # Landing page hero
│       │   └── Footer.jsx            # Footer component
│       │
│       ├── pages/
│       │   └── Download.jsx          # Download page with x402 payment
│       │
│       ├── services/
│       │   ├── api.js                # Axios API client
│       │   ├── x402Service.js        # x402 upload payment handling
│       │   └── x402Payment.js        # x402 download payment handling
│       │
│       ├── config/
│       │   └── web3.js               # RainbowKit & wagmi configuration
│       │
│       └── utils/
│           └── helpers.js            # Utility functions
│
└── backend/                           # Node.js backend server
    ├── package.json                  # Backend dependencies
    ├── server.js                     # Express server entry point
    ├── .env                          # Backend environment variables
    ├── test-neon-connection.js       # Neon database connection test
    │
    ├── config/
    │   ├── database.js               # PostgreSQL connection & initialization
    │   ├── pricing.js                # Dynamic pricing configuration
    │   └── upload.js                 # Multer file upload config
    │
    ├── models/
    │   ├── fileModel.js              # File database operations
    │   ├── paymentModel.js           # Payment database operations
    │   └── transactionModel.js       # Transaction logging
    │
    ├── routes/
    │   ├── fileRoutes.js             # Upload endpoint (x402 protected)
    │   ├── downloadRoutes.js         # Download endpoint (x402 middleware)
    │   └── paymentRoutes.js          # Payment status endpoints
    │
    ├── utils/
    │   ├── x402Helpers.js            # x402 payment verification helpers
    │   ├── helpers.js                # General utility functions
    │   └── scheduler.js              # Cron job for file cleanup
    │
    └── uploads/                       # File storage directory (gitignored)
        └── .gitkeep
```

---

## 🔌 API Endpoints

### File Management

#### Upload File (x402 Protected)
```http
POST /api/files/upload
Content-Type: multipart/form-data

Body:
- file: <binary file data>
- duration: <1 | 7 | 30>

Headers (on retry after payment):
- X-Payment: <base64-encoded-payment-proof>

Response (402 - Payment Required):
{
  "x402Version": 1,
  "error": "X-PAYMENT header is required",
  "accepts": [{
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "50000",
    "payTo": "0xbc86ca947ab27b990054870566cfe849c2109d2d",
    "resource": "http://localhost:5001/api/files/upload",
    "description": "Upload file for 1 day(s)",
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  }]
}

Response (201 - Success):
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileId": "uuid",
    "filename": "example.pdf",
    "size": 1048576,
    "duration": 1,
    "price": "0.05",
    "shareLink": "abc123def",
    "expiryDate": "2025-11-14T10:00:00.000Z",
    "paymentStatus": "completed"
  }
}
```

#### Get File Info
```http
GET /api/files/info/:shareLink

Response (200):
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "filename": "example.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "duration": 1,
    "price": "0.05",
    "shareLink": "abc123def",
    "expiryDate": "2025-11-14T10:00:00.000Z",
    "paymentStatus": "completed",
    "createdAt": "2025-11-13T10:00:00.000Z"
  }
}
```

### Download

#### Download File (x402 Protected)
```http
GET /api/download/:shareLink

Headers (after payment):
- X-Payment: <base64-encoded-payment-proof>

Response (402 - First Request):
{
  "x402Version": 1,
  "error": "X-PAYMENT header is required",
  "accepts": [{
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "50000",
    "payTo": "0xbc86ca947ab27b990054870566cfe849c2109d2d"
  }]
}

Response (200 - After Payment):
Content-Type: <file-mime-type>
Content-Disposition: attachment; filename="example.pdf"
<binary file data>
```

### System

#### Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-11-13T10:00:00.000Z",
  "database": "connected",
  "uptime": 12345
}
```

---

## 📊 Payment Flow Diagrams

### Upload Payment Flow

```
┌──────────┐
│  User    │
│ Selects  │
│   File   │
└────┬─────┘
     │
     ↓
┌──────────────────────────┐
│   Frontend              │
│   - Validates file      │
│   - Checks wallet       │
│   - Sends POST request  │
└────────┬─────────────────┘
         │
         │ POST /api/files/upload
         │ (No X-Payment header)
         ↓
┌──────────────────────────┐
│   Backend               │
│   - Calculates price    │
│   - Creates payment req │
│   - Returns 402         │
└────────┬─────────────────┘
         │
         │ 402 Payment Required
         │ {accepts: [...]}
         ↓
┌──────────────────────────┐
│   x402 Client           │
│   - Parses requirements │
│   - Checks USDC balance │
│   - Creates payment     │
└────────┬─────────────────┘
         │
         │ Request signature
         ↓
┌──────────────────────────┐
│   Wallet (MetaMask)     │
│   - Shows payment       │
│   - User approves       │
│   - Transfers USDC      │
└────────┬─────────────────┘
         │
         │ Transaction hash
         ↓
┌──────────────────────────┐
│   x402 Client           │
│   - Creates proof       │
│   - Encodes header      │
│   - Retries upload      │
└────────┬─────────────────┘
         │
         │ POST /api/files/upload
         │ X-Payment: <proof>
         ↓
┌──────────────────────────┐
│   Backend               │
│   - Decodes payment     │
│   - Verifies with x402  │
│   - Checks blockchain   │
└────────┬─────────────────┘
         │
         │ Verification via
         │ x402 Facilitator
         ↓
┌──────────────────────────┐
│   x402 Facilitator      │
│   - Queries blockchain  │
│   - Validates tx        │
│   - Returns result      │
└────────┬─────────────────┘
         │
         │ ✅ Valid
         ↓
┌──────────────────────────┐
│   Backend               │
│   - Saves file          │
│   - Records payment     │
│   - Returns share link  │
└────────┬─────────────────┘
         │
         │ 201 Created
         │ {shareLink: "abc123"}
         ↓
┌──────────────────────────┐
│   Frontend              │
│   - Shows success       │
│   - Displays link       │
│   - "Download" button   │
└──────────────────────────┘
```

### Download Payment Flow

```
┌──────────┐
│  User    │
│  Clicks  │
│   Link   │
└────┬─────┘
     │
     ↓
┌──────────────────────────┐
│   Frontend              │
│   - Loads download page │
│   - Fetches file info   │
│   - Shows download btn  │
└────────┬─────────────────┘
         │
         │ User clicks "Download & Pay"
         ↓
┌──────────────────────────┐
│   Frontend              │
│   - Sends GET request   │
│   - No payment yet      │
└────────┬─────────────────┘
         │
         │ GET /api/download/:link
         ↓
┌──────────────────────────┐
│   Backend               │
│   - x402 middleware     │
│   - Checks X-Payment    │
│   - Returns 402         │
└────────┬─────────────────┘
         │
         │ 402 Payment Required
         ↓
┌──────────────────────────┐
│   x402 Download Client  │
│   - Parses requirements │
│   - Initiates payment   │
│   - Gets signature      │
└────────┬─────────────────┘
         │
         │ USDC payment
         ↓
┌──────────────────────────┐
│   Blockchain            │
│   - Transfers USDC      │
│   - Confirms tx         │
└────────┬─────────────────┘
         │
         │ Transaction confirmed
         ↓
┌──────────────────────────┐
│   x402 Download Client  │
│   - Creates payment proof│
│   - Retries download    │
└────────┬─────────────────┘
         │
         │ GET /api/download/:link
         │ X-Payment: <proof>
         ↓
┌──────────────────────────┐
│   Backend               │
│   - Verifies payment    │
│   - Reads file          │
│   - Streams to client   │
└────────┬─────────────────┘
         │
         │ 200 OK + File Blob
         ↓
┌──────────────────────────┐
│   Browser               │
│   - Receives file       │
│   - Triggers download   │
│   - Saves to disk       │
└──────────────────────────┘
```

---

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | `5001` | Yes |
| `NODE_ENV` | Environment mode | `development` / `production` | Yes |
| `DB_HOST` | PostgreSQL host | `localhost` or Neon endpoint | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | Yes |
| `DB_NAME` | Database name | `temp_file_storage` | Yes |
| `DB_USER` | Database user | `postgres` / `neondb_owner` | Yes |
| `DB_PASSWORD` | Database password | Your password | Yes |
| `DB_SSL` | Enable SSL | `true` / `false` | Yes (true for Neon) |
| `RECEIVER_WALLET_ADDRESS` | x402 payment receiver | `0xbc86...` | Yes |
| `X402_NETWORK` | Blockchain network | `base-sepolia` | Yes |
| `X402_FACILITATOR_URL` | x402 verification service | `https://x402.org/facilitator` | Yes |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:5173` | Yes |

### Frontend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5001/api` | Yes |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Get from [cloud.walletconnect.com](https://cloud.walletconnect.com) | Yes |
| `VITE_RECEIVER_WALLET_ADDRESS` | Display payment receiver | `0xbc86...` | Yes |

---

## 🌐 Deployment

### Deploy Backend (Render.com)

1. **Create Render account**: [render.com](https://render.com)
2. **Create New Web Service**:
   - Connect GitHub repository
   - Select `backend` folder
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Add Environment Variables**: Copy all from `.env`
4. **Deploy**: Render will build and start your backend
5. **Get URL**: e.g., `https://tempfilestorage.onrender.com`

### Deploy Frontend (Vercel)
