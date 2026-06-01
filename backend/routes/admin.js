const express = require('express');
const { users, products, orders, nextOrderId } = require('../models/db');
const { authenticate } = require('./auth');

const router = express.Router();

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Apply admin middleware to all routes
router.use(authenticate);
router.use(isAdmin);

// Dashboard stats
router.get('/stats', (req, res) => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = users.length;
  
  res.json({
    totalRevenue,
    totalOrders,
    totalProducts,
    totalUsers,
    recentOrders: orders.slice(-5)
  });
});

// Product management
router.get('/products', (req, res) => {
  res.json(products);
});

router.post('/products', (req, res) => {
  const { name, description, price, category, stock, image } = req.body;
  
  const newProduct = {
    id: products.length + 1,
    name,
    description,
    price: parseFloat(price),
    category,
    stock: parseInt(stock),
    image: image || 'default.jpg'
  };
  
  products.push(newProduct);
  res.status(201).json(newProduct);
});

router.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

router.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  products.splice(index, 1);
  res.status(204).send();
});

// User management
router.get('/users', (req, res) => {
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json(safeUsers);
});

router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users.splice(index, 1);
  res.status(204).send();
});

// Order management
router.get('/orders', (req, res) => {
  res.json(orders);
});

router.put('/orders/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.status = status;
  order.updatedAt = new Date();
  res.json(order);
});

module.exports = router;