import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://*.vercel.app',
    'https://*.netlify.app'
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'factory_db';
let db;

MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(DB_NAME);
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });

// API Routes
// Note: Authentication is handled in frontend only

// Save a lot
app.post('/api/lots', async (req, res) => {
  try {
    const lotData = req.body;
    const collection = db.collection('lots');
    
    // Add timestamp
    lotData.createdAt = new Date();
    lotData.updatedAt = new Date();
    
    const result = await collection.insertOne(lotData);
    res.status(201).json({ 
      success: true, 
      id: result.insertedId,
      lotNumber: lotData.lotNumber 
    });
  } catch (error) {
    console.error('Error saving lot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all lots
app.get('/api/lots', async (req, res) => {
  try {
    const collection = db.collection('lots');
    const lots = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, lots });
  } catch (error) {
    console.error('Error fetching lots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific lot by lot number
app.get('/api/lots/:lotNumber', async (req, res) => {
  try {
    const { lotNumber } = req.params;
    const collection = db.collection('lots');
    const lot = await collection.findOne({ lotNumber });
    
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Lot not found' });
    }
    
    res.json({ success: true, lot });
  } catch (error) {
    console.error('Error fetching lot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific lot by ID
app.get('/api/lots/id/:_id', async (req, res) => {
  try {
    const { _id } = req.params;
    const collection = db.collection('lots');
    const lot = await collection.findOne({ _id: new ObjectId(_id) });
    
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Lot not found' });
    }
    
    res.json({ success: true, lot });
  } catch (error) {
    console.error('Error fetching lot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
