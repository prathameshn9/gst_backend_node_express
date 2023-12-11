require('dotenv').config();
var express = require('express');
const cors = require('cors');
// const cacheResponseDirective = require('express-cache-response-directive');
const bodyParser = require('body-parser');




// var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const port = 3000

//getting routes of api
var router = require('./routes');

// using express as app 
var app = express();


app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(cacheResponseDirective());
app.use(bodyParser.json());

app.use((req, res, next) => {
  // Middleware logic here

  // Call next() to pass control to the next middleware or route handler
  next();
});

// if (process.env.NODE_ENV === 'development') {
//   app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
// }

// if (process.env.NODE_ENV === 'production') {
//   app.use(express.errorHandler());
// }


//configuring all routes
app.use('/api/v1', router);

app.use(cors());







// Start the server
app.listen(port, () => {
 //`Server is running on port ${port}`);
});

module.exports = app;
