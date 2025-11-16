import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { analyzeFoodWaste } from './ai/vision.js';
import { initDatabase, logWaste, getWasteHistory, getWasteStats, getSuggestions, findEntryByImageHash, deleteEntryById, clearAllWasteData } from './database/db.js';
import dotenv from 'dotenv';
import { createHash } from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Ensure uploads directory exists
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
if (!existsSync('uploads')) {
  mkdir('uploads', { recursive: true }).catch(err => {
    console.error('Error creating uploads directory:', err);
  });
}

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.post('/api/analyze-waste', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    // Compute hash for deduplication/consistency
    const buffer = await (await import('fs/promises')).readFile(imagePath);
    const imageHash = createHash('sha256').update(buffer).digest('hex');

    // If duplicate image seen before, prefer previous consistent values
    const previous = findEntryByImageHash(imageHash);
    let analysis = await analyzeFoodWaste(imagePath);

    let duplicateOfEntryId = null;
    let consistencyNote = '';
    if (previous) {
      duplicateOfEntryId = previous.id || null;
      // Reuse monetary totals and item values for consistency
      // Keep latest qualitative notes from current analysis but align values
      if (previous.items && previous.items.length > 0) {
        // Map previous items by name for best-effort alignment
        const prevByName = new Map(previous.items.map(it => [it.name?.toLowerCase?.() || '', it]));
        analysis.items = analysis.items.map(it => {
          const key = (it.name || '').toLowerCase();
          const prev = prevByName.get(key);
          return {
            ...it,
            estimatedValue: prev?.estimatedValue ?? it.estimatedValue
          };
        });
      }
      // Recompute total to match previous total if significantly close
      const currentTotal = analysis.items.reduce((s, it) => s + (it.estimatedValue || 0), 0);
      const previousTotal = parseFloat(previous.total_estimated_value || 0);
      if (previousTotal > 0) {
        analysis.totalEstimatedValue = previousTotal;
        consistencyNote = `Values aligned with duplicate of entry #${previous.id} for consistency.`;
      } else {
        // Otherwise, round to nearest $0.10 for stability
        analysis.totalEstimatedValue = Math.round(currentTotal * 10) / 10;
      }
    } else {
      // First time: round total to nearest $0.10 for stability
      const currentTotal = analysis.items.reduce((s, it) => s + (it.estimatedValue || 0), 0);
      analysis.totalEstimatedValue = Math.round(currentTotal * 10) / 10;
    }

    // Log the waste entry
    const wasteEntry = await logWaste({
      imagePath: `/uploads/${req.file.filename}`,
      items: analysis.items || [],
      estimatedWaste: analysis.estimatedWaste || {},
      timestamp: new Date().toISOString(),
      notes: [analysis.notes || '', consistencyNote].filter(Boolean).join(' ').trim(),
      imageHash,
      duplicateOfEntryId,
      consistencyNote
    });

    res.json({
      success: true,
      analysis,
      wasteEntry
    });
  } catch (error) {
    console.error('Error analyzing waste:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('rate limit')) {
      statusCode = 429;
    } else if (error.message.includes('API key') || error.message.includes('API_KEY') || error.message.includes('401') || error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
      statusCode = 401;
    } else if (error.message.includes('file not found') || error.message.includes('ENOENT')) {
      statusCode = 404;
    } else if (error.message.includes('400') || error.message.includes('INVALID_ARGUMENT')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      error: 'Failed to analyze waste',
      message: error.message || 'An unknown error occurred while analyzing the image'
    });
  }
});

app.get('/api/waste-history', async (req, res) => {
  try {
    const history = await getWasteHistory(req.query);
    res.json(history);
  } catch (error) {
    console.error('Error fetching waste history:', error);
    res.status(500).json({ error: 'Failed to fetch waste history' });
  }
});

app.get('/api/waste-stats', async (req, res) => {
  try {
    const stats = await getWasteStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching waste stats:', error);
    res.status(500).json({ error: 'Failed to fetch waste stats' });
  }
});

app.get('/api/suggestions', async (req, res) => {
  try {
    const suggestions = await getSuggestions();
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.delete('/api/waste-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = deleteEntryById(id);
    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }
    return res.json(result);
  } catch (error) {
    console.error('Error deleting waste entry:', error);
    return res.status(500).json({ error: 'Failed to delete entry' });
  }
});

app.delete('/api/waste-history', async (req, res) => {
  try {
    const result = clearAllWasteData();
    res.json(result);
  } catch (error) {
    console.error('Error clearing waste history:', error);
    res.status(500).json({ error: 'Failed to clear waste history' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or change the PORT in .env`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
