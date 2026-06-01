import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function AdminDashboard({ token }) {
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    fetchStats();
    fetchProducts();
    fetchOrders();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/products`, newProduct, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Product added successfully');
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image: ''
      });
      fetchProducts();
    } catch (error) {
      alert('Error adding product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axios.delete(`${API_URL}/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      
      <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('stats')}>Stats</button>
        <button onClick={() => setActiveTab('products')}>Products</button>
        <button onClick={() => setActiveTab('orders')}>Orders</button>
        <button onClick={() => setActiveTab('users')}>Users</button>
        <button onClick={() => setActiveTab('add-product')}>Add Product</button>
      </div>

      {activeTab === 'stats' && (
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <div className="value">${stats.totalRevenue || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Orders</h3>
            <div className="value">{stats.totalOrders || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Products</h3>
            <div className="value">{stats.totalProducts || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="value">{stats.totalUsers || 0}</div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="admin-section">
          <h3>Product Management</h3>
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Price</th><th>Category</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td><td>{p.name}</td><td>${p.price}</td>
                  <td>{p.category}</td><td>{p.stock}</td>
                  <td><button onClick={() => handleDeleteProduct(p.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="admin-section">
          <h3>Order Management</h3>
          <table className="admin-table">
            <thead><tr><th>ID</th><th>User ID</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td><td>{o.userId}</td><td>${o.total}</td>
                  <td>{o.status}</td><td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-section">
          <h3>User Management</h3>
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td><td>{u.email}</td><td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'add-product' && (
        <div className="admin-section">
          <h3>Add New Product</h3>
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" placeholder="Name" value={newProduct.name} 
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required />
            <textarea placeholder="Description" value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} required />
            <input type="number" placeholder="Price" value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required />
            <input type="text" placeholder="Category" value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} required />
            <input type="number" placeholder="Stock" value={newProduct.stock}
              onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} required />
            <button type="submit">Add Product</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;