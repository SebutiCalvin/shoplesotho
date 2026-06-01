const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ========== DATABASE ==========
const users = [];
const products = [
    { id: 1, name: 'Dell XPS 15', description: 'Premium ultrabook with 12th Gen Intel Core i7', price: 1850, category: 'computers', stock: 8, rating: 4.8, image: 'https://images.pexels.com/photos/2187175/pexels-photo-2187175.jpeg?w=400' },
    { id: 2, name: 'Logitech MX Keys', description: 'Wireless illuminated keyboard', price: 110, category: 'ict', stock: 20, rating: 4.5, image: 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?w=400' },
    { id: 3, name: 'cPanel Hosting Pro', description: '50GB SSD storage, free SSL', price: 15, category: 'hosting', stock: 200, rating: 4.2, image: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?w=400' },
    { id: 4, name: 'Razer DeathAdder V3', description: 'Ergonomic gaming mouse', price: 70, category: 'ict', stock: 35, rating: 4.7, image: 'https://images.pexels.com/photos/2115292/pexels-photo-2115292.jpeg?w=400' },
    { id: 5, name: 'MacBook Air M2', description: 'Apple M2 chip, 8GB RAM', price: 1750, category: 'computers', stock: 12, rating: 4.9, image: 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?w=400' },
    { id: 6, name: 'Cloud VPS Hosting', description: '4 vCPU, 8GB RAM, 100GB NVMe', price: 45, category: 'hosting', stock: 75, rating: 4.3, image: 'https://images.pexels.com/photos/2588757/pexels-photo-2588757.jpeg?w=400' }
];

let carts = {};
let orders = [];
let nextOrderId = 1;
let nextUserId = 1;
let pageViews = 0;
let activeUsers = 0;

// ========== AUTHENTICATION ==========
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        req.user = jwt.verify(token, 'your-secret-key');
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ========== WEBSOCKET ==========
io.on('connection', (socket) => {
    activeUsers++;
    io.emit('metrics', { activeUsers, pageViews });
    socket.on('disconnect', () => {
        activeUsers--;
        io.emit('metrics', { activeUsers, pageViews });
    });
    socket.on('pageView', () => {
        pageViews++;
        io.emit('metrics', { activeUsers, pageViews });
    });
});

// ========== AUTH ENDPOINTS ==========
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(401).json({ error: 'Invalid email format' });
    }
    let user = users.find(u => u.email === email);
    if (!user) {
        user = { id: nextUserId++, email, role: email.includes('admin') ? 'admin' : 'user' };
        users.push(user);
    }
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, 'your-secret-key', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    const newUser = { id: nextUserId++, email, role: 'user' };
    users.push(newUser);
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
});

// ========== PRODUCT ENDPOINTS ==========
app.get('/api/products', (req, res) => {
    let { search, category, minPrice, maxPrice } = req.query;
    let filtered = [...products];
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (category) filtered = filtered.filter(p => p.category === category);
    if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
    res.json({ products: filtered, total: filtered.length });
});

app.get('/api/categories', (req, res) => {
    res.json([...new Set(products.map(p => p.category))]);
});

// ========== CART ENDPOINTS ==========
app.get('/api/cart', authenticate, (req, res) => {
    const userCart = carts[req.user.userId] || [];
    const cartWithDetails = userCart.map(item => ({ ...item, product: products.find(p => p.id === item.productId) }));
    res.json(cartWithDetails);
});

app.post('/api/cart', authenticate, (req, res) => {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.userId;
    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!carts[userId]) carts[userId] = [];
    const existingItem = carts[userId].find(item => item.productId === productId);
    if (existingItem) existingItem.quantity += quantity;
    else carts[userId].push({ productId, quantity });
    res.json({ message: 'Item added to cart' });
});

app.put('/api/cart/:productId', authenticate, (req, res) => {
    const userId = req.user.userId;
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;
    if (!carts[userId]) return res.status(404).json({ error: 'Cart not found' });
    const itemIndex = carts[userId].findIndex(item => item.productId === productId);
    if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });
    if (quantity <= 0) carts[userId].splice(itemIndex, 1);
    else carts[userId][itemIndex].quantity = quantity;
    res.json({ message: 'Cart updated' });
});

app.delete('/api/cart/:productId', authenticate, (req, res) => {
    const userId = req.user.userId;
    const productId = parseInt(req.params.productId);
    if (carts[userId]) carts[userId] = carts[userId].filter(item => item.productId !== productId);
    res.json({ message: 'Item removed from cart' });
});

// ========== CHECKOUT ENDPOINT - FIXED ==========
app.post('/api/checkout', authenticate, (req, res) => {
    const userId = req.user.userId;
    const userCart = carts[userId];
    
    console.log('=== CHECKOUT REQUEST ===');
    console.log('User ID:', userId);
    console.log('Cart:', JSON.stringify(userCart, null, 2));
    
    if (!userCart || userCart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }
    
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
    
    const order = {
        id: nextOrderId++,
        userId,
        items: orderItems,
        total,
        status: 'confirmed',
        createdAt: new Date()
    };
    
    orders.push(order);
    delete carts[userId];
    
    console.log('Order created:', order);
    
    res.json({ 
        success: true,
        message: 'Order placed successfully', 
        orderId: order.id, 
        total: order.total 
    });
});

app.get('/api/orders', authenticate, (req, res) => {
    const userOrders = orders.filter(o => o.userId === req.user.userId);
    res.json(userOrders);
});

// ========== METRICS ==========
app.get('/api/metrics', (req, res) => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const conversionRate = pageViews > 0 ? (orders.length / pageViews) * 100 : 0;
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    res.json({ activeUsers, pageViews, totalOrders: orders.length, totalRevenue, conversionRate, avgOrderValue });
});

// ========== ADMIN ==========
app.get('/api/admin/stats', authenticate, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json({ totalRevenue: orders.reduce((sum, o) => sum + o.total, 0), totalOrders: orders.length, totalProducts: products.length, totalUsers: users.length });
});

// ========== START SERVER ==========
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`🔌 WebSocket enabled`);
});