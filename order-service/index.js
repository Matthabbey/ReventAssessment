require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const app = express();
app.use(bodyParser.json());

const sequelize = new Sequelize(process.env.DATABASE_URL);

const Order = sequelize.define('Order', {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  }
});

sequelize.sync();

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.get('/orders', authenticateToken, async (req, res) => {
  const orders = await Order.findAll();
  res.json(orders);
});

app.post('/orders', authenticateToken, async (req, res) => {
  const { productId } = req.body;
  try {
    const order = await Order.create({ productId, userId: req.user.userId });
    res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    res.status(400).json({ message: 'Error creating order', error });
  }
});

app.get('/orders/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching order', error });
  }
});

app.put('/orders/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Order.update({ status }, { where: { id } });
    res.json({ message: 'Order updated' });
  } catch (error) {
    res.status(400).json({ message: 'Error updating order', error });
  }
});
  

app.listen(3003, () => {
  console.log('Order service listening on port 3003');
});
