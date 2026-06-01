const express = require('express');
const { products } = require('../models/db');
const router = express.Router();

// Get all products with search, filter, and pagination
router.get('/products', (req, res) => {
  let { search, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
  let filtered = [...products];
  
  // Search by name
  if (search) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Filter by category
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  
  // Filter by price range
  if (minPrice) {
    filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
  }
  
  // Pagination
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);
  
  res.json({
    products: paginated,
    total: filtered.length,
    page: parseInt(page),
    totalPages: Math.ceil(filtered.length / limit)
  });
});

// Get single product
router.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Get categories
router.get('/categories', (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  res.json(categories);
});

module.exports = router;