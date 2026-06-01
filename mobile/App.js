import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://YOUR_COMPUTER_IP:5000/api'; // Replace with your local IP

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('login');
  const [filters, setFilters] = useState({ search: '', category: '', minPrice: '', maxPrice: '' });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const storedToken = await AsyncStorage.getItem('token');
    const storedUser = await AsyncStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setCurrentScreen('products');
      fetchCategories(storedToken);
      fetchCart(storedToken);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/register`, { email, password });
        Alert.alert('Success', 'Registration successful! Please login.');
        setIsRegister(false);
      } else {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        const { token, user } = response.data;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        setCurrentScreen('products');
        fetchCategories(token);
        fetchCart(token);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (authToken) => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      
      const response = await axios.get(`${API_URL}/products?${params.toString()}`);
      setProducts(response.data.products);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async (authToken) => {
    try {
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = async (productId) => {
    try {
      await axios.post(`${API_URL}/cart`, { productId, quantity: 1 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart(token);
      Alert.alert('Success', 'Item added to cart');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`${API_URL}/cart/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart(token);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove from cart');
    }
  };

  const checkout = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', `Order placed! ID: ${response.data.orderId}\nTotal: $${response.data.total}`);
      await fetchCart(token);
      setCurrentScreen('products');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setCurrentScreen('login');
    setCart([]);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productDescription}>{item.description}</Text>
      <Text style={styles.productPrice}>${item.price}</Text>
      <Text style={styles.productCategory}>{item.category}</Text>
      <Text style={styles.productStock}>Stock: {item.stock}</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item.id)}>
        <Text style={styles.buttonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.product?.name}</Text>
        <Text>Price: ${item.product?.price}</Text>
        <Text>Quantity: {item.quantity}</Text>
        <Text>Total: ${(item.product?.price || 0) * item.quantity}</Text>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
        <Text style={styles.removeButton}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const LoginScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.authContainer}>
        <Text style={styles.title}>{isRegister ? 'Register' : 'Login'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
          <Text style={styles.switchText}>
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const ProductsScreen = () => (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Search"
          value={filters.search}
          onChangeText={(text) => setFilters({ ...filters, search: text })}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Min Price"
          value={filters.minPrice}
          onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Max Price"
          value={filters.maxPrice}
          onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.searchButton} onPress={fetchProducts}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  );

  const CartScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping Cart ({cart.length})</Text>
      {cart.length === 0 ? (
        <Text style={styles.emptyText}>Your cart is empty</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.productId.toString()}
          />
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              Total: ${cart.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)}
            </Text>
            <TouchableOpacity style={styles.checkoutButton} onPress={checkout}>
              <Text style={styles.buttonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const ProfileScreen = () => (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.profileText}>Email: {user?.email}</Text>
        <Text style={styles.profileText}>Role: {user?.role}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (currentScreen === 'login') return LoginScreen();

  return (
    <View style={styles.appContainer}>
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => { setCurrentScreen('products'); fetchProducts(); }}>
          <Text style={styles.tabText}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen('cart')}>
          <Text style={styles.tabText}>Cart ({cart.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen('profile')}>
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
      {currentScreen === 'products' && ProductsScreen()}
      {currentScreen === 'cart' && CartScreen()}
      {currentScreen === 'profile' && ProfileScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#2c3e50',
  },
  tabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authContainer: {
    padding: 20,
    marginTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  switchText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#3498db',
  },
  productCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginTop: 8,
  },
  productCategory: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  searchButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
  },
  removeButton: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  totalContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 12,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  profileContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});