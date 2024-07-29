require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());

const sequelize = new Sequelize(process.env.DATABASE_URL);

const Auction = sequelize.define('Auction', {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

sequelize.sync();

const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379
});

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Access denied'));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Invalid token'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User ${socket.user.userId} connected`);

  socket.on('bid', (bid) => {
    console.log(`User ${socket.user.userId} bid ${bid.amount} on product ${bid.productId}`);
    io.emit('newBid', bid);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.userId} disconnected`);
  });
});

app.post('/auctions', authenticateToken, async (req, res) => {
  const { productId, startTime, endTime } = req.body;
  try {
    const auction = await Auction.create({ productId, startTime, endTime });
    res.status(201).json({ message: 'Auction created', auction });
  } catch (error) {
    res.status(400).json({ message: 'Error creating auction', error });
  }
});

app.get('/auctions', authenticateToken, async (req, res) => {
  const auctions = await Auction.findAll();
  res.json(auctions);
});


server.listen(3004, () => {
  console.log('Auction service listening on port 3004');
});
