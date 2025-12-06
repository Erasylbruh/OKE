import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files (if any needed, e.g. for uploads if local, but we use cloudinary)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/comments', commentRoutes);

// Error Handler
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
