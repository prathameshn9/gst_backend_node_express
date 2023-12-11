const dbConnection = require('../db');
const helper = require("../helpers")

const users = dbConnection.collection('users')

const users_category_apps = dbConnection.collection('user_category_apps')

function login(phone) {
    let filter = {
        phone: phone,
    }
    let project = {
        "_id": 1,
        "password_hash": 1,
    }
    return  users.findOne(filter, {projection: project})
}

function checkUserByIdUserCategory(userId) {
    let filter = {
        "_id": helper.objectId(userId),
    }
    project = {
        "userId": 1,
        "_id": 0,
    }
    return  users_category_apps.findOne(filter, {projection: project})
}


function checkUserById(userId) {
    let filter = {
        "_id":userId,
    }
    return  users.findOne(filter)
}

module.exports = { login, checkUserByIdUserCategory, checkUserById }
