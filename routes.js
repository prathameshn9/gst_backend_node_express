var express = require('express');
var router = express.Router();
const jwtVerify = require("./jwt/jwt_signature_verify")
const controller = require('./controller')


router.post("/login/category", controller.securityController.login)
router.post("/add/csv/data", jwtVerify.authenticateToken, controller.gstDataController.gstData)
router.get("/batch/:batch_id/get/template/data", jwtVerify.authenticateToken, controller.gstDataController.getTemplateData)
// router.get("/get/template/data", jwtVerify.authenticateToken, controller.gstDataController.getTemplateData)
router.put("/compare/csv/data", jwtVerify.authenticateToken, controller.gstDataController.compareGstData)
router.get("/batch/:batch_id/get/compare/data", jwtVerify.authenticateToken, controller.gstDataController.getComparedData)
router.put("/batch/:batch_id/move/data", jwtVerify.authenticateToken, controller.gstDataController.moveData)
router.get("/get/batchid", jwtVerify.authenticateToken, controller.gstDataController.getBatchId)
router.put("/batch/:batch_id/probability/add", jwtVerify.authenticateToken, controller.gstDataController.probabilityAdd)
router.put("/batch/:batch_id/approve/gst/data", jwtVerify.authenticateToken, controller.gstDataController.approveGstData)
router.get("/batch/:batch_id/get/gstin", jwtVerify.authenticateToken, controller.gstDataController.getGstin)
router.put("/batch/:batch_id/probability/add/gstin", jwtVerify.authenticateToken, controller.gstDataController.probabilityAddGstin)
router.put("/batch/:batch_id/probability/exists/gstin", jwtVerify.authenticateToken, controller.gstDataController.probabilityExistsGstin)
// router.post("/groups/:group_id/add/client", jwtVerify.authenticateToken,controller.clientController.addClient )
router.get("/batch/:batch_id/get/number", jwtVerify.authenticateToken, controller.gstDataController.getMatchNumber)
router.put("/batch/:batch_id/delete/data", jwtVerify.authenticateToken, controller.gstDataController.deleteOldData)


module.exports = router;