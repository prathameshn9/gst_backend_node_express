const securityRepo = require("../repo/security_repo")
const errors = require("../errors_helper")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const secretKey = process.env.SECRET_KEY;

const saltRounds = 10;

const login = (countryDetails, phone, password, res) => {
    securityRepo.login(countryDetails.countryCode + phone).then((data) => {
        if (!data){
            return errors.errorHandler("Phone Number  Not Registered", res, 400)
        }
        bcrypt.compare(password, data["password_hash"], (err, result) => {
            if (err) {
              console.error('Error comparing passwords:', err);
              return;
            }
            if (result) {
              let userData = CryptoJS.AES.encrypt(JSON.stringify(data["_id"]), secretKey).toString();
              const token = jwt.sign(userData, errors.NewprivateKey(), { algorithm: 'RS256' });
              data =  {
                "userId": data["_id"].toString(),
                "phone": phone,
                "countryName": countryDetails.countryName,
                "alpha2":  countryDetails.alpha2,
                "token": token 
              }
              return errors.render(data, res, 200)
            } else {
                return errors.errorHandler("Invalid Credential", res, 400)
            }
          });
    }).catch((error) => {
    console.error('Error executing query:', error);
  });
}

module.exports = { login }

