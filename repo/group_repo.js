const helper = require("../helpers");

const dbConnection = require("../db");

const groups = dbConnection.collection("groups");


const groupData = async (groupId) => {
    filter = {
      _id: helper.objectId(groupId),
      isActive: true,
    };
    try {
      let  group = await groups.findOne(filter)
      return group
    } catch (error) {
      // Handle error
      console.error("An error occurred:", error);
      throw error;
    }
};

module.exports = {
    groupData
}