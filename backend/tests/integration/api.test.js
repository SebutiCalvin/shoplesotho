const request = require('supertest');
const { app } = require('../../server');

describe('API Integration Tests', () => {
    let authToken;

    test('TC-INT-001: GET /api/products - Should return products', async () => {
        const response = await request(app).get('/api/products');
        expect(response.status).toBe(200);
        expect(response.body.products).toBeDefined();
        expect(Array.isArray(response.body.products)).toBe(true);
    });

    test('TC-INT-002: GET /api/categories - Should return categories', async () => {
        const response = await request(app).get('/api/categories');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toContain('computers');
        expect(response.body).toContain('ict');
        expect(response.body).toContain('hosting');
    });

    test('TC-INT-003: POST /api/login - Should login user', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ email: 'admin@test.com', password: 'any' });
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
        authToken = response.body.token;
    });

    test('TC-INT-004: POST /api/register - Should create new user', async () => {
        const response = await request(app)
            .post('/api/register')
            .send({ email: 'testuser@test.com', password: 'password123' });
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('User registered successfully');
    });

    test('TC-INT-005: POST /api/cart - Should add to cart', async () => {
        const response = await request(app)
            .post('/api/cart')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ productId: 1, quantity: 2 });
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Item added to cart');
    });

    test('TC-INT-006: GET /api/cart - Should return user cart', async () => {
        const response = await request(app)
            .get('/api/cart')
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('TC-INT-007: POST /api/checkout - Should process order', async () => {
        const response = await request(app)
            .post('/api/checkout')
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(200);
        expect(response.body.orderId).toBeDefined();
    });

    test('TC-INT-008: GET /api/orders - Should return user orders', async () => {
        const response = await request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('TC-INT-009: POST /api/login - Should reject invalid credentials', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ email: 'nonexistent@test.com', password: 'wrongpassword' });
        expect(response.status).toBe(401);
        expect(response.body.error).toBeDefined();
    });

    test('TC-INT-010: GET /api/products?search=laptop - Should return filtered products', async () => {
        const response = await request(app)
            .get('/api/products?search=laptop');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.products)).toBe(true);
    });
});