const express = require('express');
const path = require('path');
const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Home', name: 'Michael' });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact' });
});

app.post('/contact', (req, res) => {
  console.log('Form submitted:', req.body);
  res.send(`<h1>Thank you, ${req.body.name}!</h1>`);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
