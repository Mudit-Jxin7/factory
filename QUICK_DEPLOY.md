# Quick Free Deployment Guide

## 🚀 Recommended: Vercel (Frontend) + Render (Backend)

Both are completely free and easy to set up!

---

## Step 1: Deploy Backend on Render (5 minutes)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to [render.com](https://render.com)**
   - Sign up/login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Backend:**
   - **Name**: `factory-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**

4. **Add Environment Variables:**
   - `MONGODB_URI`: `mongodb+srv://muditert34_db_user:Zr9uAwt7oB9TwhDk@cluster0.tbsntnb.mongodb.net/?appName=Cluster0`
   - `DB_NAME`: `factory_db`
   - `PORT`: `10000`
   - `FRONTEND_URL`: Leave empty for now (we'll update after frontend deploy)

5. **Click "Create Web Service"**
   - Wait for deployment (~2-3 minutes)
   - Copy your backend URL (e.g., `https://factory-backend.onrender.com`)

---

## Step 2: Deploy Frontend on Vercel (5 minutes)

1. **Go to [vercel.com](https://vercel.com)**
   - Sign up/login with GitHub
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Frontend:**
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
   - **Install Command**: `npm install` (auto-filled)

3. **Add Environment Variable:**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
     (Replace with your actual Render backend URL from Step 1)

4. **Click "Deploy"**
   - Wait for deployment (~1-2 minutes)
   - Copy your frontend URL (e.g., `https://factory-xyz.vercel.app`)

---

## Step 3: Update Backend CORS (2 minutes)

1. **Go back to Render Dashboard**
2. **Click on your backend service**
3. **Go to "Environment" tab**
4. **Update `FRONTEND_URL`:**
   - **Value**: Your Vercel frontend URL (e.g., `https://factory-xyz.vercel.app`)
5. **Click "Save Changes"** - Render will automatically redeploy

---

## Step 4: Update Frontend API URL (if needed)

If you didn't add the environment variable during deployment:

1. **Go to Vercel Dashboard**
2. **Click on your project**
3. **Go to Settings → Environment Variables**
4. **Add:**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
5. **Redeploy** (or it will auto-redeploy on next push)

---

## ✅ That's It!

Your app is now live:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

---

## 🔄 Automatic Deployments

Both platforms automatically deploy when you push to GitHub:
- **Vercel**: Deploys on every push to main branch
- **Render**: Deploys on every push to main branch

---

## 📝 Important Notes

### Render Free Tier:
- ⚠️ Spins down after 15 minutes of inactivity
- ⏱️ Takes ~30 seconds to wake up on first request
- ✅ Perfect for development and small projects

### Vercel Free Tier:
- ✅ Always online
- ✅ 100GB bandwidth/month
- ✅ Unlimited builds
- ✅ Perfect for production

### MongoDB Atlas:
- ✅ Already free (you're using it)
- ✅ 512MB storage
- ✅ No changes needed

---

## 🐛 Troubleshooting

### CORS Errors:
- Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Check backend CORS configuration in `server.js`

### API Not Found:
- Verify `VITE_API_URL` in Vercel matches your Render backend URL
- Make sure URL ends with `/api`

### MongoDB Connection:
- Verify `MONGODB_URI` is correct in Render environment variables
- Check MongoDB Atlas IP whitelist (should allow all IPs: `0.0.0.0/0`)

---

## 🎯 Alternative Free Options

### Frontend:
- **Netlify**: Similar to Vercel, also free
- **GitHub Pages**: Free but requires build setup

### Backend:
- **Railway**: Free tier with $5 credit/month
- **Cyclic**: Free tier, always-on
- **Fly.io**: Free tier with generous limits

---

## 📚 Need More Help?

Check `DEPLOYMENT.md` for detailed deployment options and configurations.
