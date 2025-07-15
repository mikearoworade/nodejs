const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Dummy data - Users
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', age: 28 }
];

// Dummy data - Products
let products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 50 },
  { id: 2, name: 'Coffee Mug', price: 12.99, category: 'Home', stock: 100 },
  { id: 3, name: 'Running Shoes', price: 89.99, category: 'Sports', stock: 30 },
  { id: 4, name: 'Notebook', price: 5.99, category: 'Stationery', stock: 200 }
];

// Helper function to get next ID
const getNextId = (array) => {
  return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the RESTful API',
    endpoints: {
      users: '/api/users',
      products: '/api/products'
    }
  });
});

// ========== USERS ENDPOINTS ==========

// GET all users
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users,
    count: users.length
  });
});

// GET user by ID
app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// POST create new user
app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;

  // Basic validation
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }

  // Check if email already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists'
    });
  }

  const newUser = {
    id: getNextId(users),
    name,
    email,
    age: age || null
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  });
});

// PUT update user
app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const { name, email, age } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }

  // Check if email already exists (excluding current user)
  const existingUser = users.find(u => u.email === email && u.id !== id);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already exists'
    });
  }

  users[userIndex] = {
    ...users[userIndex],
    name,
    email,
    age: age || users[userIndex].age
  };

  res.json({
    success: true,
    data: users[userIndex],
    message: 'User updated successfully'
  });
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const deletedUser = users.splice(userIndex, 1)[0];

  res.json({
    success: true,
    data: deletedUser,
    message: 'User deleted successfully'
  });
});

// ========== PRODUCTS ENDPOINTS ==========

// GET all products
app.get('/api/products', (req, res) => {
  const { category, minPrice, maxPrice } = req.query;
  let filteredProducts = [...products];

  // Filter by category
  if (category) {
    filteredProducts = filteredProducts.filter(p =>
      p.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter by price range
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }

  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }

  res.json({
    success: true,
    data: filteredProducts,
    count: filteredProducts.length
  });
});

// GET product by ID
app.get('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

// POST create new product
app.post('/api/products', (req, res) => {
  const { name, price, category, stock } = req.body;

  // Basic validation
  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name, price, and category are required'
    });
  }

  const newProduct = {
    id: getNextId(products),
    name,
    price: parseFloat(price),
    category,
    stock: parseInt(stock) || 0
  };

  products.push(newProduct);

  res.status(201).json({
    success: true,
    data: newProduct,
    message: 'Product created successfully'
  });
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const { name, price, category, stock } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name, price, and category are required'
    });
  }

  products[productIndex] = {
    ...products[productIndex],
    name,
    price: parseFloat(price),
    category,
    stock: parseInt(stock) || products[productIndex].stock
  };

  res.json({
    success: true,
    data: products[productIndex],
    message: 'Product updated successfully'
  });
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const deletedProduct = products.splice(productIndex, 1)[0];

  res.json({
    success: true,
    data: deletedProduct,
    message: 'Product deleted successfully'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation:`);
  console.log(`- GET    /api/users        - Get all users`);
  console.log(`- GET    /api/users/:id    - Get user by ID`);
  console.log(`- POST   /api/users        - Create new user`);
  console.log(`- PUT    /api/users/:id    - Update user`);
  console.log(`- DELETE /api/users/:id    - Delete user`);
  console.log(`- GET    /api/products     - Get all products`);
  console.log(`- GET    /api/products/:id - Get product by ID`);
  console.log(`- POST   /api/products     - Create new product`);
  console.log(`- PUT    /api/products/:id - Update product`);
  console.log(`- DELETE /api/products/:id - Delete product`);
});

module.exports = app;