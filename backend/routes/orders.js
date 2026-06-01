const express = require('express');
const { carts, orders, nextOrderId, products } = require('../models/db');
const { authenticate } = require('./auth');

const router = express.Router();

// Checkout (simulated payment)
router.post('/checkout', authenticate, (req, res) => {
  const userId = req.user.userId;
  const userCart = carts[userId];
  
  if (!userCart || userCart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  
  // Calculate total and prepare order items
  let total = 0;
  const orderItems = userCart.map(item => {
    const product = products.find(p => p.id === item.productId);
    const itemTotal = product.price * item.quantity;
    total += itemTotal;
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      price: product.price,
      subtotal: itemTotal
    };
  });
  
  // Create order
  const order = {
    id: nextOrderId++,
    userId,
    items: orderItems,
    total,
    status: 'pending',
    paymentStatus: 'simulated_paid',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  orders.push(order);
  
  // Clear cart
  delete carts[userId];
  
  // Simulate payment processing
  setTimeout(() => {
    order.status = 'processing';
    order.updatedAt = new Date();
  }, 100);
  
  res.json({
    message: 'Order placed successfully',
    orderId: order.id,
    total,
    status: order.status,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });
});

// Get user orders
router.get('/orders', authenticate, (req, res) => {
  const userOrders = orders.filter(o => o.userId === req.user.userId);
  res.json(userOrders);
});

// Get single order
router.get('/orders/:id', authenticate, (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.userId !== req.user.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(order);
});

// Track order
router.get('/track/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json({
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    estimatedDelivery: new Date(order.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000)
  });
});

module.exports = router;