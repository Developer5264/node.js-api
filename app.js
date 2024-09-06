const express = require('express');
const authRoutes = require('./routes/authRoutes');
const connectDB = require('./config/db');

const app = express();
connectDB();
app.use(express.json());

app.use('/api/auth', authRoutes);

module.exports = app;
