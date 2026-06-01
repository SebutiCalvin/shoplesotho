const express = require('express');
const { carts, products } = require('../models/db');
const { authenticate } = require('./auth');

const router = express.Router();

// Get cart
router.get('/cart', authenticate, (req, res) => {
  const userCart = carts[req.user.userId] || [];
  const cartWithDetails = userCart.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId)
  }));
  res.json(cartWithDetails);
});

// Add to cart
router.post('/cart', authenticate, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.userId;
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  if (!carts[userId]) {
    carts[userId] = [];
  }
  
  const existingItem = carts[userId].find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[userId].push({ productId, quantity, addedAt: new Date() });
  }
  
  res.json({ message: 'Item added to cart', cart: carts[userId] });
});

// Update cart item quantity
router.put('/cart/:productId', authenticate, (req, res) => {
  const { quantity } = req.body;
  const userId = req.user.userId;
  const productId = parseInt(req.params.productId);
  
  if (!carts[userId]) {
    return res.status(404).json({ error: 'Cart not found' });
  }
  
  const item = carts[userId].find(item => item.productId === productId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  if (quantity <= 0) {
    carts[userId] = carts[userId].filter(item => item.productId !== productId);
  } else {
    item.quantity = quantity;
  }
  
  res.json({ message: 'Cart updated', cart: carts[userId] });
});

// Remove from cart
router.delete('/cart/:productId', authenticate, (req, res) => {
  const userId = req.user.userId;
  const productId = parseInt(req.params.productId);
  
  if (carts[userId]) {
    carts[userId] = carts[userId].filter(item => item.productId !== productId);
  }
  
  res.json({ message: 'Item removed from cart', cart: carts[userId] || [] });
});

// Clear cart
router.delete('/cart', authenticate, (req, res) => {
  const userId = req.user.userId;
  delete carts[userId];
  res.json({ message: 'Cart cleared' });
});

module.exports = router;