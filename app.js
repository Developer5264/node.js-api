const express = require('express');
const authRoutes = require('./routes/authRoutes');
const connectDB = require('./config/db');
const app = express();
const cors = require('cors');
const path = require('path');

connectDB();
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


module.exports = app;
