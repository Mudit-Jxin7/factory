# Free Deployment Guide

This guide covers free deployment options for both the frontend (React) and backend (Node.js/Express).

## Option 1: Vercel (Frontend) + Render (Backend) - Recommended

### Frontend Deployment on Vercel (Free)

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Create `vercel.json`** in project root:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "framework": "vite"
   }
   ```

3. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Click "Deploy"

4. **Environment Variables** (if needed):
   - Go to Project Settings → Environment Variables
   - Add any frontend env variables

### Backend Deployment on Render (Free)

1. **Create `render.yaml`** in project root:
   ```yaml
   services:
     - type: web
       name: factory-backend
       env: node
       buildCommand: npm install
       startCommand: node server.js
       envVars:
         - key: MONGODB_URI
           value: mongodb+srv://muditert34_db_user:Zr9uAwt7oB9TwhDk@cluster0.tbsntnb.mongodb.net/?appName=Cluster0
         - key: DB_NAME
           value: factory_db
         - key: PORT
           value: 10000
   ```

2. **Deploy via Render Dashboard**:
   - Go to [render.com](https://render.com)
   - Sign up/login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `factory-backend`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `node server.js`
     - Instance Type: Free
   - Add Environment Variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `DB_NAME`: `factory_db`
     - `PORT`: `10000` (Render uses this port)
   - Click "Create Web Service"

3. **Update CORS in `server.js`**:
   ```javascript
   // Update CORS to allow your Vercel frontend URL
   app.use(cors({
     origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
     credentials: true
   }));
   ```

4. **Update Frontend API URL**:
   - In `src/api/api.js`, update `API_BASE_URL` to your Render backend URL
   - Example: `const API_BASE_URL = 'https://factory-backend.onrender.com/api'`

---

## Option 2: Netlify (Frontend) + Railway (Backend)

### Frontend Deployment on Netlify (Free)

1. **Create `netlify.toml`** in project root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy via Netlify Dashboard**:
   - Go to [netlify.com](https://netlify.com)
   - Sign up/login with GitHub
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

### Backend Deployment on Railway (Free)

1. **Create `railway.json`** (optional):
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "node server.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Deploy via Railway Dashboard**:
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add Environment Variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `DB_NAME`: `factory_db`
     - `PORT`: Railway auto-assigns, use `process.env.PORT`
   - Railway auto-detects Node.js and deploys

---

## Option 3: GitHub Pages (Frontend) + Cyclic (Backend)

### Frontend Deployment on GitHub Pages (Free)

1. **Update `vite.config.js`**:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/factory/', // Your repo name
   })
   ```

2. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add to `package.json`**:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

### Backend Deployment on Cyclic (Free)

1. **Go to [cyclic.sh](https://cyclic.sh)**
2. **Sign up/login with GitHub**
3. **Click "Deploy Now"**
4. **Select your repository**
5. **Cyclic auto-detects Node.js**
6. **Add Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `DB_NAME`: `factory_db`

---

## Important Notes

### Backend Server Updates Needed

Update `server.js` to use environment PORT:

```javascript
const PORT = process.env.PORT || 3001;
```

### CORS Configuration

Update CORS in `server.js` to allow your frontend domain:

```javascript
app.use(cors({
  origin: [
    'https://your-frontend-domain.vercel.app',
    'https://your-frontend-domain.netlify.app',
    'http://localhost:5173' // For local development
  ],
  credentials: true
}));
```

### Frontend API Configuration

Update `src/api/api.js`:

```javascript
// For production
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-backend-url.onrender.com/api'

// Or hardcode your backend URL
const API_BASE_URL = 'https://your-backend-url.onrender.com/api'
```

Create `.env.production`:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### MongoDB Atlas

Your MongoDB is already on Atlas (free tier), so no changes needed!

---

## Recommended: Vercel + Render

**Why?**
- ✅ Both have generous free tiers
- ✅ Easy GitHub integration
- ✅ Automatic deployments on git push
- ✅ Good performance
- ✅ Free SSL certificates
- ✅ Easy to set up

**Limitations:**
- Render free tier spins down after 15 minutes of inactivity (takes ~30s to wake up)
- Vercel free tier: 100GB bandwidth/month

---

## Quick Start Commands

### For Vercel:
```bash
npm install -g vercel
vercel
```

### For Render:
Just connect GitHub repo in dashboard - it's that easy!

---

## Troubleshooting

1. **CORS Errors**: Make sure backend CORS includes your frontend URL
2. **API Not Found**: Check API_BASE_URL in frontend matches backend URL
3. **MongoDB Connection**: Verify MONGODB_URI is correct in backend env vars
4. **Build Fails**: Check Node version (use Node 18+)
