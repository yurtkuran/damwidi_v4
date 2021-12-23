const express = require('express');

// clear console
console.clear();

// configure dotenv - bring in configuration variables, passwords and keys
require('dotenv').config();

// set timezone
process.env.TZ = 'America/New_York';

// bring in local modules
const connectDB = require('./config/db');

// connect to database
connectDB.connectMongoDB(); // mongo database
// connectDB.connectMySQL(); // MySQL database

// initalize app
const app = express();

// body parser middleware
app.use(express.json({ extended: false }));

// inital route
// app.get('/', (req, res) => res.json({ msg: 'Welcome to the ContactKeeper API...' }));
app.get('/', (req, res) => res.send('api running...'));

// define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alphaVantage', require('./routes/alphaVantage'));
app.use('/api/confirm', require('./routes/confirm'));
app.use('/api/damwidi', require('./routes/damwidi'));
app.use('/api/etf', require('./routes/etf'));
app.use('/api/marketData', require('./routes/marketData'));
app.use('/api/iex', require('./routes/iex'));
app.use('/api/sectors', require('./routes/sectors'));
app.use('/api/stocks', require('./routes/stocks'));
// app.use('/api/stockdata', require('./routes/stockdata'));  // to-do: remove from code
app.use('/api/users', require('./routes/users'));

// server static assets in production
if (process.env.NODE_ENV === 'production') {
    // set static folder
    app.use(express.static('client/build'));

    // set default 'route'
    app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html')));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));

console.log(process.env.NODE_ENV);
