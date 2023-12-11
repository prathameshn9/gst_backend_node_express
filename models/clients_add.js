const mongoose = require('mongoose');


const clientDataModel = new mongoose.Schema({
    phone: { type: String, required: true },
    countryCode: {type: String, required: true},
    gstin: { type: String, required: true },
    name: { type: String, required: true},
    isActive: { type: Boolean, default: true },
}, { timestamps: true });


const clientModel = mongoose.model('teams', clientDataModel)


module.exports = clientModel;