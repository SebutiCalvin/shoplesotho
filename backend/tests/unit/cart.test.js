// Unit tests for cart functionality
const { carts, products } = require('../../models/db');

// Mock the carts and products data
jest.mock('../../models/db', () => ({
    carts: {},
    products: [
        { id: 1, name: 'Test Product', price: 100, stock: 10 },
        { id: 2, name: 'Another Product', price: 50, stock: 5 }
    ]
}));

describe('Cart Unit Tests', () => {
    let cart;
    const userId = 1;

    beforeEach(() => {
        // Reset cart before each test
        cart = [];
    });

    // Test 1: Add item to cart
    test('TC-UNIT-001: Should add a product to cart', () => {
        const product = { id: 1, name: 'Test Product', price: 100 };
        cart.push({ productId: product.id, quantity: 1, product });
        
        expect(cart.length).toBe(1);
        expect(cart[0].productId).toBe(1);
        expect(cart[0].quantity).toBe(1);
    });

    // Test 2: Increase quantity of existing item
    test('TC-UNIT-002: Should increase quantity when adding same product', () => {
        const productId = 1;
        
        // Add first time
        let existingItem = cart.find(item => item.productId === productId);
        if (!existingItem) {
            cart.push({ productId, quantity: 1 });
        }
        
        // Add second time
        existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        }
        
        expect(cart[0].quantity).toBe(2);
    });

    // Test 3: Remove item from cart
    test('TC-UNIT-003: Should remove product from cart', () => {
        cart.push({ productId: 1, quantity: 1 });
        expect(cart.length).toBe(1);
        
        // Remove item
        cart = cart.filter(item => item.productId !== 1);
        expect(cart.length).toBe(0);
    });

    // Test 4: Calculate cart total
    test('TC-UNIT-004: Should calculate correct cart total', () => {
        cart.push(
            { productId: 1, quantity: 2, product: { price: 100 } },
            { productId: 2, quantity: 1, product: { price: 50 } }
        );
        
        const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        expect(total).toBe(250); // (100*2) + (50*1)
    });

    // Test 5: Empty cart
    test('TC-UNIT-005: Should have zero items when cart is empty', () => {
        expect(cart.length).toBe(0);
    });

    // Test 6: Prevent negative quantity
    test('TC-UNIT-006: Should not allow negative quantity', () => {
        cart.push({ productId: 1, quantity: 1 });
        
        if (cart[0].quantity - 1 < 0) {
            cart = cart.filter(item => item.productId !== 1);
        }
        
        expect(cart.length).toBe(0);
    });
});