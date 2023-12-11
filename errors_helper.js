const fs = require('fs');

const privateKey = fs.readFileSync('./private_key.pem', 'utf8');

const publicKey = fs.readFileSync('./public_key.pem', 'utf8');

function errorHandler(err, res, statusCode) {
    // console.error('Error:', err);
    res.status(statusCode || 500).json({ statusCode: statusCode, error: err });
}

function render(data, res, statusCode) {
    res.status(statusCode || 500).json(data);
    
}

function NewprivateKey(){
    return privateKey;
}

function NewpublicKey(){
    return publicKey;
  }


module.exports = {errorHandler, NewprivateKey, render, NewpublicKey}
