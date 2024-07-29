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

app.get('/products', authenticateToken, async (req, res) => {
  const products = await Product.findAll();
  res.json(products);
});

app.post('/products', authenticateToken, async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const product = await Product.create({ name, description, price });
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    res.status(400).json({ message: 'Error creating product', error });
  }
});

app.put('/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    await Product.update({ name, description, price }, { where: { id } });
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error });
  }
});

app.delete('/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await Product.destroy({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting product', error });
  }
});

app.post('/products/:id/auction', authenticateToken, async (req, res) => {
  const { id } = req.params;
  // Logic to start an auction for the product
  res.json({ message: `Auction started for product ${id}` });
});


app.listen(3002, () => {
  console.log('Product service listening on port 3002');
});
