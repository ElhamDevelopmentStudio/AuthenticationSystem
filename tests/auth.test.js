const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { v4: uuidv4 } = require('uuid');

describe('Authentication', () => {
  let user;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    // Create a test user
    user = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'testing@example.com',
        passwordHash: 'hashedpassword',
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuserforthisasdfd',
        email: 'test23@example.com',  // Ensure email is unique for this test
        password: 'password123'
      });
    console.log('Response body:', res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
    expect(res.body).toHaveProperty('userId');
  });
  
  it('should not register a user with an existing email', async () => {
    // Register a user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'test3@example.com',  // Ensure email is unique for this test
        password: 'password123'
      });

    // Attempt to register with the same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });

  it('should log in a user and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: "test3@example.com",
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;

    console.log('Access token:', accessToken);
    console.log('Refresh token:', refreshToken);
  });

  it('should refresh tokens', async () => {
    console.log('Refresh token:', refreshToken);  // Debugging
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Content-Type', 'application/json') 
      .send({ refreshToken });
  
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should logout a user', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
  
});
