# Temp File Storage - Frontend

React frontend for temporary file storage with x402 crypto payment integration.

## Features

- 🎨 Modern UI with Tailwind CSS
- 📤 Drag & Drop File Upload
- 💳 Crypto Payment Flow (x402)
- 🔗 Shareable Links
- ⏰ Expiry Countdown
- 📱 Responsive Design

## Prerequisites

- Node.js 18+ and npm
- Backend server running on port 5000

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Create .env file (already created)
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

The app will open at `http://localhost:5173`

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Hero.jsx       # Landing hero section
│   │   ├── FileUpload.jsx # File upload form
│   │   ├── PaymentSuccess.jsx # Success screen
│   │   └── Footer.jsx     # Footer
│   ├── services/
│   │   └── api.js         # API client
│   ├── utils/
│   │   └── helpers.js     # Utility functions
│   ├── App.jsx            # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── vite.config.js
└── tailwind.config.js
```

## Features

### File Upload
- Drag & drop or browse
- Max 100MB file size
- Real-time validation
- Progress indicator

### Storage Duration Options
- 1 Day - $0.05 USDC
- 7 Days - $0.15 USDC
- 30 Days - $0.25 USDC

### Payment Flow
1. Upload file and select duration
2. System generates share link
3. Pay with crypto via x402
4. Download or share link

### Shareable Links
- Copy to clipboard
- Public access after payment
- Auto-expiry tracking

## Technologies

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## API Integration

The frontend connects to backend API:

```javascript
// Upload file
POST /api/files/upload
- file: File
- duration: number (1, 7, or 30)

// Get file info
GET /api/files/info/:shareLink

// Download file
GET /api/download/:shareLink
```

## Styling

Using Tailwind CSS with custom configuration:
- Primary color: Blue (#0ea5e9)
- Custom components: buttons, cards, inputs
- Responsive breakpoints
- Dark mode ready

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- 🔐 Web3 wallet authentication (RainbowKit)
- 📊 User dashboard
- 📈 Upload history
- 🔔 Email notifications
- 🌙 Dark mode toggle

## Troubleshooting

### CORS Issues
Ensure backend has correct `FRONTEND_URL` in `.env`

### API Connection Failed
- Check backend is running on port 5000
- Verify `VITE_API_URL` in `.env`

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## License

MIT
