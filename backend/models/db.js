// In-memory database
const users = [
  { 
    id: 1, 
    email: 'admin@test.com', 
    password: '$2b$10$YourHashedPasswordHere', // Use "admin123" after hashing
    role: 'admin' 
  },
  { 
    id: 2, 
    email: 'user@test.com', 
    password: '$2b$10$YourHashedPasswordHere', // Use "user123" after hashing
    role: 'user' 
  }
];

const products = [
  { id: 1, name: 'Gaming Laptop', description: 'High performance gaming laptop', price: 1200, category: 'computers', stock: 10, image: 'laptop.jpg' },
  { id: 2, name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', price: 80, category: 'ict', stock: 25, image: 'keyboard.jpg' },
  { id: 3, name: 'Web Hosting Basic', description: '1 year basic hosting', price: 5, category: 'hosting', stock: 100, image: 'hosting.jpg' },
  { id: 4, name: 'Gaming Mouse', description: 'Wireless gaming mouse', price: 45, category: 'ict', stock: 30, image: 'mouse.jpg' },
  { id: 5, name: 'Business Laptop', description: 'Lightweight business laptop', price: 900, category: 'computers', stock: 15, image: 'business-laptop.jpg' },
  { id: 6, name: 'Premium Web Hosting', description: '5 years premium hosting', price: 200, category: 'hosting', stock: 50, image: 'premium-hosting.jpg' }
];

let carts = {}; // { userId: [{ productId, quantity, addedAt }] }
let orders = [];
let nextOrderId = 1;
let nextUserId = 3;

module.exports = { users, products, carts, orders, nextOrderId, nextUserId };