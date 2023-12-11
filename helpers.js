const countryData = require('country-data').callingCountries;
const phoneNumber = require('libphonenumber-js');
const mongoose = require('mongoose');
// const { ObjectId } = require('bson-objectid');


function countryCodeISD(countryCode){
    let countryDetails = countryData[countryCode]
    if(countryDetails){
        return {
            "countryCode": countryData[countryCode]["countryCallingCodes"][0],
            "alpha2": countryData[countryCode]["alpha2"],
            "countryName":  countryData[countryCode]["name"],
        }
    }else{
        return  false
    }
   
}

function validate_phone_number(countryCode, phone){
    let parsedPhoneNumber = phoneNumber.parse(phone, countryCode);
    const isValid = phoneNumber.isValidNumber(parsedPhoneNumber);
    return isValid ? true : false
}

function objectId(stringId) {
    ////typeof(stringId))
   return mongoose.Types.ObjectId(stringId);
}

function stringObjectId() {
    var id = new mongoose.Types.ObjectId();
    ////id)
    return id
}

function indian_time(){
    const date = new Date();
    const options = {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    };
    return date.toLocaleString('en-US', options);
}

module.exports = {
    countryCodeISD,
    validate_phone_number,
    objectId,
    stringObjectId,
    indian_time
};
