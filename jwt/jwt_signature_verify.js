const errors = require("../errors_helper")

const jwt = require('jsonwebtoken');

const securityRepo = require("../repo/security_repo");


// const secretKey = process.env.SECRET_KEY;

// const CryptoJS = require('crypto-js');


const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ statusCode: 401, error: 'Unauthorized' });
    }
  
    jwt.verify(token, errors.NewpublicKey(), (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = decoded;
      ////req.user)
      // const decryptedData = CryptoJS.AES.decrypt(req.user, secretKey).toString(CryptoJS.enc.Utf8);
      // userData = JSON.parse(decryptData).toString()
      securityRepo.checkUserByIdUserCategory(req.user.sub.id).then((data) => {
        if (!data) {
          return res.status(401).json({ statusCode: 401, error: 'Unauthorized' });
        } else {
          // get user data
          securityRepo.checkUserById(data.userId).then((data) => {
            req.userData = data
            ////req.userData)
            next();
          }).catch((error) => {
             console.error('Error executing query:', error);
          });
         
        } 
      }).catch((error) => {
        console.error('Error executing query:', error);
      });
     
    });
};

module.exports = {authenticateToken}
  