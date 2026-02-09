# Factory Dashboard - Next.js Version

This is a Next.js version of the Factory Dashboard application with integrated frontend and backend.

## Features

- ✅ Single codebase for frontend and backend
- ✅ Next.js API routes (no separate Express server needed)
- ✅ MongoDB integration
- ✅ Authentication
- ✅ Lot production tracking
- ✅ PDF export
- ✅ Responsive design

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create `.env.local` file:

```
MONGODB_URI=your_mongodb_connection_string
DB_NAME=factory_db
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
factory-nextjs/
├── app/
│   ├── api/              # API routes (backend)
│   │   ├── lots/         # Lot endpoints
│   │   └── health/       # Health check
│   ├── dashboard/        # Dashboard page
│   ├── login/            # Login page
│   └── lot/              # Lot view page
├── components/           # React components
├── lib/                  # Utilities (MongoDB, auth)
└── public/               # Static files
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Vercel will automatically:
- Build your Next.js app
- Deploy API routes
- Handle serverless functions

### Other Platforms

- **Netlify**: Supports Next.js with serverless functions
- **Railway**: Full Node.js support
- **Render**: Web service deployment

## API Endpoints

- `GET /api/lots` - Get all lots
- `POST /api/lots` - Save a lot
- `GET /api/lots/[lotNumber]` - Get specific lot
- `GET /api/health` - Health check

## Default Credentials

- Username: `admin`
- Password: `admin123`
