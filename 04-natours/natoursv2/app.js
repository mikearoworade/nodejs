const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// creating middleware
app.use((req,res,next) => {
    console.log('Hello from middleware!');
    next();
})

app.use((req,res,next) => {
    req.resquestTime = new Date().toISOString();
    next();
})

// Mounting a new router
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;