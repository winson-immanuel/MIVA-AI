const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// Middleware
// ============================================================

app.use(cors());

app.use(express.json({
  limit: '50mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

// ============================================================
// Upload Directory
// Vercel serverless functions can only write to /tmp
// ============================================================

const uploadsDir = process.env.VERCEL
  ? '/tmp/miva-ai-uploads'
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, {
    recursive: true
  });
}

app.use('/uploads', express.static(uploadsDir));

// ============================================================
// Route Imports
// ============================================================

const authRoutes = require('./routes/auth');
const knowledgeRoutes = require('./routes/knowledge');
const chatRoutes = require('./routes/chat');
const visionRoutes = require('./routes/vision');
const workInstructionRoutes = require('./routes/workInstructions');
const alertRoutes = require('./routes/alerts');
const evalRoutes = require('./routes/evaluation');

// ============================================================
// API Routes
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/work-instructions', workInstructionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/evaluation', evalRoutes);

// ============================================================
// Health Check
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    product: 'MIVA AI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// Developers
// ============================================================

const store = require('./data/store');

app.get('/api/developers', (req, res) => {
  res.json({
    developers: store.data.developers
  });
});

// ============================================================
// Update Developer
// ============================================================

app.patch('/api/developers/:id', (req, res) => {
  const dev = store.data.developers.find(
    d => d.id === req.params.id
  );

  if (!dev) {
    return res.status(404).json({
      error: 'Developer not found'
    });
  }

  if (req.body.avatar) {
    dev.avatar = req.body.avatar;
  }

  if (req.body.name) {
    dev.name = req.body.name;
  }

  if (req.body.role) {
    dev.role = req.body.role;
  }

  store.save();

  res.json({
    developer: dev
  });
});

// ============================================================
// Serve Frontend Build If Available
// ============================================================

const frontendDist = path.join(
  __dirname,
  '../frontend/dist'
);

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads')
    ) {
      return next();
    }

    res.sendFile(
      path.join(frontendDist, 'index.html')
    );
  });
}

// ============================================================
// Error Handler
// ============================================================

app.use((err, req, res, next) => {
  console.error('MIVA AI Server Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Unknown server error'
  });
});

// ============================================================
// Start Server
// ============================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(
      '  MIVA AI - Manufacturing Intelligence & Vision Assistant'
    );
    console.log(
      '  L&T Shop-Floor Knowledge Partner'
    );
    console.log(
      `  Server running on http://localhost:${PORT}`
    );
    console.log('====================================================');
  });
}

// ============================================================
// Export
// ============================================================

module.exports = app;