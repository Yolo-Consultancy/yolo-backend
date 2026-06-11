const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { success } = require('zod');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Yolo Backend is running successfully!' 
  });
});

module.exports = app;