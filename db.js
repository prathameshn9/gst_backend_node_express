// db.js

const mongoose = require('mongoose');

const mongoDBUrl = 'mongodb://127.0.0.1:27017/gruppie';

// Establish MongoDB connection
mongoose.connect(mongoDBUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
  //console.log( 'Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Export the MongoDB connection object
module.exports = mongoose.connection;
