// const clientAddHandler = require("../handler/clients_add_handler");
// const groupRepo = require("../repo/group_repo")
// const errors = require("../errors_helper");
// const UserValidator = require("../models/userValidator");



// //"/groups/:group_id/add/client"
// const addClient = async (req, res) => {
//   try {
//     let group = await groupRepo.groupData(req.params.group_id);
//     // //console.log(group)
//     if (group.category != "school") {
//       return errors.errorHandler({ type: "Page Not Found" }, res, 404);
//     }
  
  
//     // Perform validation

//   } catch (error) { }
// }


// module.exports = {
//   addClient
// }