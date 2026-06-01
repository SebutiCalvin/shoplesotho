import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Cart({ cart, removeFromCart, token }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await axios.post(`${API_URL}/checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Order placed! Order ID: ${response.data.orderId}\nTotal: $${response.data.total}`);
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Your cart is empty</h2>
        <p>Add some products to your cart to continue shopping.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Shopping Cart</h2>
      <div className="cart-table">
        <div className="cart-item cart-header">
          <div>Product</div>
          <div>Price</div>
          <div>Quantity</div>
          <div>Total</div>
        </div>
        {cart.map(item => (
          <div key={item.productId} className="cart-item">
            <div>{item.product?.name}</div>
            <div>${item.product?.price}</div>
            <div>{item.quantity}</div>
            <div>${(item.product?.price || 0) * item.quantity}</div>
          </div>
        ))}
      </div>
      <div className="cart-total">
        <strong>Total: ${calculateTotal()}</strong>
      </div>
      <button 
        className="checkout-btn" 
        onClick={handleCheckout}
        disabled={checkoutLoading}
      >
        {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
      </button>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#7f8c8d' }}>
        * Simulated payment - No real charges
      </p>
    </div>
  );
}

export default Cart;