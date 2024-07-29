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

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user'
  }
});

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
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

const checkAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

app.get('/users', authenticateToken, checkAdmin, async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.put('/users/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;
  try {
    await User.update({ username, role }, { where: { id } });
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error });
  }
});

app.delete('/users/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await User.destroy({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting user', error });
  }
});

app.get('/products', authenticateToken, async (req, res) => {
  const products = await Product.findAll();
  res.json(products);
});

app.post('/products', authenticateToken, checkAdmin, async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const product = await Product.create({ name, description, price });
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    res.status(400).json({ message: 'Error creating product', error });
  }
});

app.put('/products/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    await Product.update({ name, description, price }, { where: { id } });
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error });
  }
});

app.delete('/products/:id', authenticateToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await Product.destroy({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting product', error });
  }
});

app.listen(3001, () => {
  console.log('Admin service listening on port 3001');
});
