const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'users.json');

// File-based data store
let users = [];

// Initialize data file
function initializeDataFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      users = JSON.parse(data);
      console.log(`Loaded ${users.length} users from ${DATA_FILE}`);
    } else {
      // Create initial data
      users = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' }
      ];
      saveUsersToFile();
      console.log(`Created initial data file: ${DATA_FILE}`);
    }
  } catch (error) {
    console.error('Error initializing data file:', error.message);
    // Fallback to default data
    users = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ];
  }
}

// Save users to file
function saveUsersToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users to file:', error.message);
  }
}

// Async version for better performance
function saveUsersToFileAsync() {
  fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), (error) => {
    if (error) {
      console.error('Error saving users to file:', error.message);
    }
  });
}

// Helper function to parse JSON body
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      callback(null, parsed);
    } catch (error) {
      callback(error, null);
    }
  });
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Helper function to send HTML response
function sendHTML(res, statusCode, html) {
  res.writeHead(statusCode, { 'Content-Type': 'text/html' });
  res.end(html);
}

// Route handler
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Enable CORS for all routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route: Home page
  if (path === '/' && method === 'GET') {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Node.js Web Server</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .route { margin: 10px 0; padding: 10px; background: #f5f5f5; }
            code { background: #e8e8e8; padding: 2px 4px; }
          </style>
        </head>
        <body>
          <h1>Welcome to Node.js Web Server</h1>
          <p>Available routes (data persisted to users.json):</p>
          <div class="route"><strong>GET /</strong> - This home page</div>
          <div class="route"><strong>GET /about</strong> - About page</div>
          <div class="route"><strong>GET /users</strong> - Get all users</div>
          <div class="route"><strong>GET /users/:id</strong> - Get user by ID</div>
          <div class="route"><strong>POST /users</strong> - Create new user</div>
          <div class="route"><strong>PUT /users/:id</strong> - Update user</div>
          <div class="route"><strong>DELETE /users/:id</strong> - Delete user</div>
        </body>
      </html>
    `;
    sendHTML(res, 200, html);
    return;
  }

  // Route: About page
  if (path === '/about' && method === 'GET') {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>About - Node.js Web Server</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>About This Server</h1>
          <p>This is a basic Node.js web server with routing capabilities.</p>
          <p>It demonstrates:</p>
          <ul>
            <li>HTTP request routing</li>
            <li>Different HTTP methods (GET, POST, PUT, DELETE)</li>
            <li>JSON API endpoints</li>
            <li>Simple data management</li>
          </ul>
          <p><a href="/">← Back to Home</a></p>
        </body>
      </html>
    `;
    sendHTML(res, 200, html);
    return;
  }

  // Route: Get all users
  if (path === '/users' && method === 'GET') {
    sendJSON(res, 200, { users });
    return;
  }

  // Route: Get user by ID
  if (path.startsWith('/users/') && method === 'GET') {
    const userId = parseInt(path.split('/')[2]);
    const user = users.find(u => u.id === userId);

    if (user) {
      sendJSON(res, 200, { user });
    } else {
      sendJSON(res, 404, { error: 'User not found' });
    }
    return;
  }

  // Route: Create new user
  if (path === '/users' && method === 'POST') {
    parseBody(req, (error, data) => {
      if (error) {
        sendJSON(res, 400, { error: 'Invalid JSON' });
        return;
      }

      if (!data.name || !data.email) {
        sendJSON(res, 400, { error: 'Name and email are required' });
        return;
      }

      const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name: data.name,
        email: data.email
      };

      users.push(newUser);
      saveUsersToFileAsync();
      sendJSON(res, 201, { user: newUser });
    });
    return;
  }

  // Route: Update user
  if (path.startsWith('/users/') && method === 'PUT') {
    const userId = parseInt(path.split('/')[2]);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      sendJSON(res, 404, { error: 'User not found' });
      return;
    }

    parseBody(req, (error, data) => {
      if (error) {
        sendJSON(res, 400, { error: 'Invalid JSON' });
        return;
      }

      if (data.name) users[userIndex].name = data.name;
      if (data.email) users[userIndex].email = data.email;

      saveUsersToFileAsync();
      sendJSON(res, 200, { user: users[userIndex] });
    });
    return;
  }

  // Route: Delete user
  if (path.startsWith('/users/') && method === 'DELETE') {
    const userId = parseInt(path.split('/')[2]);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      sendJSON(res, 404, { error: 'User not found' });
      return;
    }

    users.splice(userIndex, 1);
    saveUsersToFileAsync();
    sendJSON(res, 200, { message: 'User deleted successfully' });
    return;
  }

  // 404 for all other routes
  sendJSON(res, 404, { error: 'Route not found' });
}

// Initialize data file before starting server
initializeDataFile();

// Create and start the server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Data persisted to: ${DATA_FILE}`);
  console.log('Available routes:');
  console.log('  GET    /           - Home page');
  console.log('  GET    /about      - About page');
  console.log('  GET    /users      - Get all users');
  console.log('  GET    /users/:id  - Get user by ID');
  console.log('  POST   /users      - Create new user');
  console.log('  PUT    /users/:id  - Update user');
  console.log('  DELETE /users/:id  - Delete user');
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});