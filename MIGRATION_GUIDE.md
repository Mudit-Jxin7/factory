# Migration Guide: React App → Next.js App

This Next.js version combines frontend and backend in a single codebase.

## Key Differences

### Backend
- **Before**: Separate Express server (`server.js`)
- **Now**: Next.js API routes in `app/api/` folder
- **Benefit**: No need to manage separate server, deploy as one unit

### Frontend
- **Before**: React Router for routing
- **Now**: Next.js file-based routing
- **Benefit**: Better SEO, server-side rendering options

### API Calls
- **Before**: `http://localhost:3001/api`
- **Now**: `/api` (relative, works in production automatically)

## Next Steps

1. **Copy Dashboard Component**: Migrate `src/Dashboard.jsx` to `components/DashboardContent.tsx`
2. **Copy LotView Component**: Migrate `src/LotView.jsx` to `components/LotViewContent.tsx`
3. **Copy Styles**: Migrate `src/App.css` to `app/globals.css` or component styles
4. **Test**: Run `npm run dev` and test all functionality

## File Structure

```
factory-nextjs/
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── lots/
│   │   │   ├── route.ts        # GET, POST /api/lots
│   │   │   └── [lotNumber]/
│   │   │       └── route.ts    # GET /api/lots/[lotNumber]
│   │   └── health/
│   │       └── route.ts        # GET /api/health
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard page
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── lot/
│   │   └── [lotNumber]/
│   │       └── page.tsx        # Lot view page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home (redirects)
│   └── globals.css             # Global styles
├── components/
│   ├── DashboardContent.tsx    # Main dashboard component
│   ├── LotViewContent.tsx      # Lot view component
│   └── ProtectedRoute.tsx     # Auth guard
└── lib/
    ├── mongodb.ts              # MongoDB connection
    ├── auth.ts                 # Auth credentials
    └── api.ts                  # API client
```

## Deployment

### Single Deployment on Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `MONGODB_URI`
   - `DB_NAME`
   - `NEXT_PUBLIC_API_URL` (optional, defaults to `/api`)
4. Deploy!

That's it! Frontend and backend deploy together.
