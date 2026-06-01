import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = 'https://shoplesotho.onrender.com/api';
const socket = io('https://shoplesotho.onrender.com');

function App() {
    // ========== STATE VARIABLES ==========
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [currentPage, setCurrentPage] = useState('login');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [wishlist, setWishlist] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);

    // ========== HELPER FUNCTIONS ==========
    const formatCurrency = (amount) => `L ${amount.toLocaleString()}.00`;

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // ========== FETCH DATA ==========
    useEffect(() => {
        if (token) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
                setCurrentPage('products');
                fetchProducts();
                fetchCategories();
                fetchCart();
                fetchOrders();
            }
        }
    }, [token]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/products`);
            setProducts(response.data.products || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/categories`);
            setCategories(response.data);
        } catch (error) { console.error(error); }
    };

    const fetchCart = async () => {
        try {
            const response = await axios.get(`${API_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart(response.data);
        } catch (error) { console.error(error); }
    };

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data);
        } catch (error) { console.error(error); }
    };

    // ========== CART FUNCTIONS ==========
    const addToCart = async (productId) => {
        try {
            await axios.post(`${API_URL}/cart`, { productId, quantity: 1 }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchCart();
            showToast('🛒 Added to cart!');
        } catch (error) { showToast('Failed to add'); }
    };

    const removeFromCart = async (productId) => {
        try {
            await axios.delete(`${API_URL}/cart/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchCart();
            showToast('Removed from cart');
        } catch (error) { showToast('Failed to remove'); }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) { removeFromCart(productId); return; }
        try {
            await axios.put(`${API_URL}/cart/${productId}`, { quantity: newQuantity }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchCart();
        } catch (error) { console.error(error); }
    };

    // ✅ SIMPLE WORKING CHECKOUT ✅
    const handleCheckout = async () => {
        console.log('===== CHECKOUT BUTTON CLICKED =====');
        console.log('Cart items:', cart.length);
        
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        const currentToken = localStorage.getItem('token');
        console.log('Token exists:', !!currentToken);
        
        if (!currentToken) {
            alert('Please login first!');
            setCurrentPage('login');
            return;
        }
        
        setLoading(true);
        
        try {
            console.log('Sending checkout request...');
            const response = await axios.post(`${API_URL}/checkout`, {}, {
                headers: { 
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response received:', response.data);
            
            if (response.data && response.data.orderId) {
                alert(`✅ ORDER PLACED!\n\nOrder ID: ${response.data.orderId}\nTotal: ${formatCurrency(response.data.total)}`);
                await fetchCart();
                await fetchOrders();
                setCurrentPage('orders');
                setDiscount(0);
                setCouponCode('');
                setShowConfirmModal(false);
            } else {
                alert('Checkout failed. No order ID returned.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert(`Checkout failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const applyCoupon = () => {
        const coupons = { 'WELCOME10': 10, 'SAVE20': 20, 'SHOPLESOTHO': 15 };
        if (coupons[couponCode.toUpperCase()]) {
            setDiscount(coupons[couponCode.toUpperCase()]);
            showToast(`🎉 Coupon applied!`);
        } else {
            showToast('❌ Invalid coupon');
        }
    };

    const getCartTotal = () => cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    const getDiscountedTotal = () => getCartTotal() - (getCartTotal() * discount / 100);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setToken(response.data.token);
            setUser(response.data.user);
            setCurrentPage('products');
            fetchProducts();
            fetchCategories();
            fetchCart();
            fetchOrders();
            showToast(`Welcome!`);
        } catch (error) { showToast('Login failed'); }
        finally { setLoading(false); }
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setUser(null);
        setCurrentPage('login');
        setCart([]);
        showToast('Logged out');
    };

    const generateInvoice = (order) => {
        const doc = new jsPDF();
        doc.text('ShopLesotho Invoice', 20, 20);
        doc.text(`Order #${order.id}`, 20, 40);
        doc.text(`Total: L ${order.total}`, 20, 60);
        doc.save(`invoice-${order.id}.pdf`);
    };

    const addToWishlist = (id) => {
        if (wishlist.includes(id)) {
            setWishlist(wishlist.filter(i => i !== id));
            showToast('Removed from wishlist');
        } else {
            setWishlist([...wishlist, id]);
            showToast('Added to wishlist');
        }
    };

    // ========== LOGIN SCREEN ==========
    if (currentPage === 'login') {
        return (
            <div style={styles.loginContainer}>
                <div style={styles.loginCard}>
                    <h1 style={{ fontSize: '48px' }}>🇱🇸</h1>
                    <h1>ShopLesotho</h1>
                    <h2>{isRegister ? 'Register' : 'Login'}</h2>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
                    <button onClick={handleLogin} style={styles.button}>{isRegister ? 'Register' : 'Login'}</button>
                    <button onClick={() => setIsRegister(!isRegister)} style={styles.linkButton}>
                        {isRegister ? 'Back to Login' : 'Create Account'}
                    </button>
                    <p style={{ fontSize: '12px', marginTop: '20px' }}>Demo: admin@test.com (any password)</p>
                </div>
            </div>
        );
    }

    // ========== STYLES ==========
    const currentStyles = darkMode ? stylesDark : stylesLight;

    // ✅ SIMPLE MODAL WITH DIRECT BUTTON ✅
    const ConfirmationModal = () => (
        <div style={styles.modalOverlay}>
            <div style={styles.modal}>
                <h3>🛒 Confirm Your Order</h3>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Total: {formatCurrency(getDiscountedTotal())}</p>
                {discount > 0 && <p>🎉 {discount}% off applied</p>}
                <p>💎 Points: {Math.floor(getDiscountedTotal() / 10)}</p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
                    <button 
                        onClick={() => {
                            console.log('CONFIRM BUTTON CLICKED');
                            setShowConfirmModal(false);
                            handleCheckout();
                        }} 
                        style={{ background: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        ✅ Confirm Order
                    </button>
                    <button 
                        onClick={() => {
                            console.log('CANCEL BUTTON CLICKED');
                            setShowConfirmModal(false);
                        }} 
                        style={{ background: '#ef4444', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        ❌ Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={currentStyles.app}>
            {showConfirmModal && <ConfirmationModal />}
            
            <button onClick={() => setDarkMode(!darkMode)} style={styles.themeToggle}>
                {darkMode ? '☀️' : '🌙'}
            </button>

            <nav style={currentStyles.navbar}>
                <h2>🛒 ShopLesotho</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setCurrentPage('products')}>Products ({products.length})</button>
                    <button onClick={() => setCurrentPage('cart')}>Cart ({cart.length})</button>
                    <button onClick={() => setCurrentPage('orders')}>Orders ({orders.length})</button>
                    <button onClick={() => setCurrentPage('wishlist')}>❤️ ({wishlist.length})</button>
                    <button onClick={logout}>Logout</button>
                </div>
                <div>{user?.email} | 💎 {loyaltyPoints}</div>
            </nav>

            <div style={currentStyles.container}>
                {/* Products Page */}
                {currentPage === 'products' && (
                    <div>
                        <h1>Welcome To Shop Lesotho! 🇱🇸</h1>
                        <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
                            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, padding: '10px' }} />
                            <button onClick={() => fetchProducts()}>Search</button>
                        </div>

                        {loading ? <p>Loading...</p> : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                                {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                                    <div key={p.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                                        <h3>{p.name}</h3>
                                        <p>{formatCurrency(p.price)}</p>
                                        <p>⭐ {p.rating}/5 | Stock: {p.stock}</p>
                                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                                            <button onClick={() => addToCart(p.id)} style={{ background: '#1e3c72', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add to Cart</button>
                                            <button onClick={() => addToWishlist(p.id)} style={{ background: '#8b5cf6', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{wishlist.includes(p.id) ? '❤️' : '🤍'}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Cart Page */}
                {currentPage === 'cart' && (
                    <div>
                        <h1>Shopping Cart</h1>
                        {cart.length === 0 ? <p>Cart empty</p> : (
                            <>
                                {cart.map(item => (
                                    <div key={item.productId} style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #ddd', padding: '10px', alignItems: 'center' }}>
                                        <img src={item.product?.image} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                        <div style={{ flex: 1 }}><strong>{item.product?.name}</strong><br />{formatCurrency(item.product?.price)}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: '30px', height: '30px', borderRadius: '5px', border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: '30px', height: '30px', borderRadius: '5px', border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}>+</button>
                                        </div>
                                        <div><strong>{formatCurrency((item.product?.price || 0) * item.quantity)}</strong></div>
                                        <button onClick={() => removeFromCart(item.productId)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>✕</button>
                                    </div>
                                ))}
                                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                    <h3>Total: {formatCurrency(getDiscountedTotal())}</h3>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                        <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }} />
                                        <button onClick={applyCoupon} style={{ background: '#8b5cf6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Apply</button>
                                    </div>
                                    <br />
                                    <button 
                                        onClick={() => {
                                            console.log('Proceed to Checkout clicked');
                                            setShowConfirmModal(true);
                                        }} 
                                        style={{ background: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Orders Page */}
                {currentPage === 'orders' && (
                    <div>
                        <h1>Order History</h1>
                        {orders.length === 0 ? <p>No orders yet</p> : orders.map(o => (
                            <div key={o.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                                <p><strong>Order #{o.id}</strong> - {new Date(o.createdAt).toLocaleDateString()}</p>
                                <p>Total: {formatCurrency(o.total)}</p>
                                <button onClick={() => generateInvoice(o)} style={{ background: '#dc2626', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>📄 PDF Invoice</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Wishlist Page */}
                {currentPage === 'wishlist' && (
                    <div>
                        <h1>Wishlist</h1>
                        {wishlist.length === 0 ? <p>Wishlist empty</p> : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                {products.filter(p => wishlist.includes(p.id)).map(p => (
                                    <div key={p.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                                        <img src={p.image} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                                        <h3>{p.name}</h3>
                                        <p>{formatCurrency(p.price)}</p>
                                        <button onClick={() => addToCart(p.id)} style={{ background: '#1e3c72', color: 'white', width: '100%', padding: '8px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add to Cart</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <footer style={currentStyles.footer}>
                <p>© 2026 ShopLesotho | Datamak Technologies</p>
            </footer>
        </div>
    );
}

// ========== STYLES ==========
const stylesLight = {
    app: { minHeight: '100vh', background: '#f5f5f5' },
    navbar: { background: '#1e3c72', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '30px' },
    footer: { textAlign: 'center', padding: '20px', background: '#1e3c72', color: 'white', marginTop: '30px' },
};

const stylesDark = {
    app: { minHeight: '100vh', background: '#1a1a2e', color: 'white' },
    navbar: { background: '#16213e', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '30px' },
    footer: { textAlign: 'center', padding: '20px', background: '#16213e', color: 'white', marginTop: '30px' },
};

const styles = {
    loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#1e3c72' },
    loginCard: { background: 'white', padding: '40px', borderRadius: '16px', width: '400px', textAlign: 'center' },
    input: { width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #ddd', borderRadius: '8px' },
    button: { width: '100%', padding: '12px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    linkButton: { background: 'none', border: 'none', color: '#1e3c72', cursor: 'pointer', marginTop: '10px' },
    themeToggle: { position: 'fixed', bottom: '20px', right: '20px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '24px', cursor: 'pointer', zIndex: 1000 },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 },
    modal: { background: 'white', padding: '30px', borderRadius: '16px', textAlign: 'center', minWidth: '300px' },
};

export default App;