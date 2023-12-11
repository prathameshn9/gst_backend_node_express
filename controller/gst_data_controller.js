const gstHandler = require("../handler/gst_data_handler");

const multer = require("multer");

const upload = multer().single("csvFile");

const csv = require("fast-csv");

const helper = require("../helpers");

const moment = require("moment");

const _ = require("lodash");

const stream = require('stream');

const gstRepo = require("../repo/gst_data_repo");
// add/csv/data
// const gstData = (req, res) => {
//   upload(req, res, (err) => {
//     if (err) {
//       res.status(400).send("Something went wrong!");
//     }
//     let parsedDate = null;
//     const dateFormats = [
//       "DD.MM.YYYY",
//       "DD/MM/YYYY",
//       "DD-MM-YYYY",
//       "D.M.YYYY",
//       "D/M/YYYY",
//       "D-M-YYYY",
//       "DD.M.YYYY",
//       "DD/M/YYYY",
//       "DD-M-YYYY",
//       "DD.MM.YY",
//       "DD/MM/YY",
//       "DD-MM-YY",
//       "D.M.YY",
//       "D/M/YY",
//       "D-M-YY",
//       "DD.M.YY",
//       "DD/M/YY",
//       "DD-M-YY",
//       "YYYY-MMMM-DD",
//       "YYYY-MMM-DD",
//       "DD-MMM-YY",
//     ];
//     ////req.file)
//     const fileData = req.file.buffer.toString("utf8");
//     let results = [];
//     let batchObjectId = "";
//     if (req.query.batchId != "") {
//       batchObjectId = helper.objectId(req.query.batchId);
//       ////batchObjectId)
//     } else {
//       batchObjectId = helper.objectId(helper.stringObjectId());
//     }
//     let batchMatchData = {
//       pm: 1,
//       cm: 1,
//       mm: 1,
//       batchId: batchObjectId,
//       isActive: true
//     }
//     gstRepo.addBatchNumberMap(batchMatchData)
//     csv
//       .parseString(fileData, { headers: true })
//       .on("data", (data) => {
//         // console.log(data["DATE"])
//         data = trimObjectKeys(data);
//         const parsed = moment(data["DATE"].trim(), dateFormats, true);
//         if (parsed.isValid()) {
//           parsedDate = parsed.format("DD-MM-YYYY");
//         } else {
//           parsedDate = data["DATE"].trim();
//         }
//         if (data["GSTIN"].toString().trim() != "" ||  data["IGST"].toString().trim().replace(/,/g, "") != "" ||
//             data["CGST"].toString().trim().replace(/,/g, "") != "" ||
//             data["SGST"].toString().trim().replace(/,/g, "") != "") {
//               let map = {
//                 gstIn: data["GSTIN"].toString().trim(),
//                 date: data["DATE"].toString().trim(),
//                 newDate: parsedDate,
//                 taxableValue: data["TAXABLE VALUE"]
//                   .toString()
//                   .trim()
//                   .replace(/,/g, ""),
//                 igst: data["IGST"].toString().trim().replace(/,/g, ""),
//                 cgst: data["CGST"].toString().trim().replace(/,/g, ""),
//                 sgst: data["SGST"].toString().trim().replace(/,/g, ""),
//                 invoiceNumber: data["INVOICE NUMBER"]
//                   .toString()
//                   .trim()
//                   .replace(/^[\'"\.]+|[\'"\.]+$/g, ""),
//                 type: req.query.type,
//                 templeteId: helper.objectId(helper.stringObjectId()),
//                 isActive: true,
//                 insertedAt: helper.indian_time(),
//                 updatedAt: helper.indian_time(),
//                 gstInMatched: false,
//                 dateMatched: false,
//                 taxableValueMatched: false,
//                 igstMatched: false,
//                 cgstMatched: false,
//                 sgstMatched: false,
//                 invoiceNumberMatched: false,
//                 batchId: batchObjectId,
//                 allMatched: false,
//                 allMisMatched: false,
//                 editId: helper.stringObjectId().toString(),
//                 newInvoiceNumber: data["INVOICE NUMBER"]
//                   .trim()
//                   .replace(/^[.,'"\s]+|[.,'"\s]+$/g, "")
//                   .toLowerCase()
//                   .replace(/^0+/, ""),
//                 totalSumAmount:
//                   parseFloat(
//                     handleNaN(data["IGST"].toString().trim().replace(/,/g, ""))
//                   ) +
//                   parseFloat(
//                     handleNaN(data["CGST"].toString().trim().replace(/,/g, ""))
//                   ) +
//                   parseFloat(
//                     handleNaN(data["SGST"].toString().trim().replace(/,/g, ""))
//                 ),
//               };
//               delete data.GSTIN;
//               delete data.DATE;
//               delete data["TAXABLE VALUE"];
//               delete data["INVOICE NUMBER"];
//               delete data.IGST;
//               delete data.CGST;
//               delete data.SGST;
//               let mergedData = _.merge({}, map, data);
//               // console.log(mergedData)
//               results.push(mergedData);
//         }
//       })
//       .on("end", () => {
//         let clientObjectId = helper.objectId(req.query.clientId);
//         let groupObjectId = helper.objectId(req.query.groupId);
//         gstHandler.gstData(
//           results,
//           req.query.type,
//           res,
//           batchObjectId,
//           req.query.month,
//           req.query.year,
//           clientObjectId,
//           groupObjectId,
//           batchMatchData
//         );
//       })
//       .on("error", (error) => {
//         console.error("Error occurred during CSV parsing:", error);
//         res.status(500).send("Error occurred during CSV parsing");
//       });
//   });
// };


const gstData = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).send("Something went wrong!");
    }

    const dateFormats = [
      "DD.MM.YYYY",
            "DD/MM/YYYY",
            "DD-MM-YYYY",
            "D.M.YYYY",
            "D/M/YYYY",
            "D-M-YYYY",
            "DD.M.YYYY",
            "DD/M/YYYY",
            "DD-M-YYYY",
            "DD.MM.YY",
            "DD/MM/YY",
            "DD-MM-YY",
            "D.M.YY",
            "D/M/YY",
            "D-M-YY",
            "DD.M.YY",
            "DD/M/YY",
            "DD-M-YY",
            "YYYY-MMMM-DD",
            "YYYY-MMM-DD",
            "DD-MMM-YY",
    ];

    const results = [];
    const batchObjectId = req.query.batchId ? helper.objectId(req.query.batchId) : helper.objectId(helper.stringObjectId());
    // const batchMatchData = { pm: 1, cm: 1, mm: 1, batchId: batchObjectId, isActive: true };

    // gstRepo.addBatchNumberMap(batchMatchData);

    const transformStream = new stream.Transform({
      objectMode: true,
      transform: function (data, encoding, callback) {
        data = trimObjectKeys(data);
        let parsed = moment(data["DATE"].trim(), dateFormats, true);
                if (parsed.isValid()) {
                  parsedDate = parsed.format("DD-MM-YYYY");
                } else {
                  parsedDate = data["DATE"].trim();
                }

        if (
          data["GSTIN"].toString().trim() !== "" ||
          data["IGST"].toString().trim().replace(/,/g, "") !== "" ||
          data["CGST"].toString().trim().replace(/,/g, "") !== "" ||
          data["SGST"].toString().trim().replace(/,/g, "") !== ""
        ) {
          const map = {
            gstIn: data["GSTIN"].toString().trim(),
                            date: data["DATE"].toString().trim(),
                            newDate: parsedDate,
                            taxableValue: data["TAXABLE VALUE"]
                              .toString()
                              .trim()
                              .replace(/,/g, ""),
                            igst: data["IGST"].toString().trim().replace(/,/g, ""),
                            cgst: data["CGST"].toString().trim().replace(/,/g, ""),
                            sgst: data["SGST"].toString().trim().replace(/,/g, ""),
                            invoiceNumber: data["INVOICE NUMBER"]
                              .toString()
                              .trim()
                              .replace(/^[\'"\.]+|[\'"\.]+$/g, ""),
                            type: req.query.type,
                            templeteId: helper.objectId(helper.stringObjectId()),
                            isActive: true,
                            gstInMatched: false,
                            dateMatched: false,
                            taxableValueMatched: false,
                            igstMatched: false,
                            cgstMatched: false,
                            sgstMatched: false,
                            invoiceNumberMatched: false,
                            batchId: batchObjectId,
                            allMatched: false,
                            allMisMatched: false,
                            editId: helper.stringObjectId().toString(),
                            newInvoiceNumber: data["INVOICE NUMBER"]
                              .trim()
                              .replace(/^[.,'"\s]+|[.,'"\s]+$/g, "")
                              .toLowerCase()
                              .replace(/^0+/, ""),
                            totalSumAmount:
                              parseFloat(
                                handleNaN(data["IGST"].toString().trim().replace(/,/g, ""))
                              ) +
                              parseFloat(
                                handleNaN(data["CGST"].toString().trim().replace(/,/g, ""))
                              ) +
                              parseFloat(
                                handleNaN(data["SGST"].toString().trim().replace(/,/g, ""))
                            ),
          };

          delete data.GSTIN;
          delete data.DATE;
          delete data["TAXABLE VALUE"];
          delete data["INVOICE NUMBER"];
          delete data.IGST;
          delete data.CGST;
          delete data.SGST;

          const mergedData = _.merge({}, map, data);
          results.push(mergedData);
        }

        callback();
      },
    });

    transformStream.on('finish', async () => {
      try {
        const clientObjectId = helper.objectId(req.query.clientId);
        const groupObjectId = helper.objectId(req.query.groupId);

        gstHandler.gstData(
          results,
          req.query.type,
          res,
          batchObjectId,
          req.query.month,
          req.query.year,
          clientObjectId,
          groupObjectId
        );
      } catch (error) {
        console.error("Error processing CSV data:", error);
        res.status(500).send("Error processing CSV data");
      }
    });

    csv
      .parseString(req.file.buffer.toString('utf8'), { headers: true })
      .on('error', (error) => {
        console.error("Error occurred during CSV parsing:", error);
        res.status(500).send("Error occurred during CSV parsing");
      })
      .pipe(transformStream);
  });
};

// const gstData = async (req, res) => {
//   try {
//     await new Promise((resolve, reject) => {
//       upload(req, res, async (err) => {
//         if (err) {
//           reject("Something went wrong!");
//           return;
//         }

//         const dateFormats = [
//           "DD.MM.YYYY",
//                       "DD/MM/YYYY",
//                       "DD-MM-YYYY",
//                       "D.M.YYYY",
//                       "D/M/YYYY",
//                       "D-M-YYYY",
//                       "DD.M.YYYY",
//                       "DD/M/YYYY",
//                       "DD-M-YYYY",
//                       "DD.MM.YY",
//                       "DD/MM/YY",
//                       "DD-MM-YY",
//                       "D.M.YY",
//                       "D/M/YY",
//                       "D-M-YY",
//                       "DD.M.YY",
//                       "DD/M/YY",
//                       "DD-M-YY",
//                       "YYYY-MMMM-DD",
//                       "YYYY-MMM-DD",
//                       "DD-MMM-YY",
//         ];
//         const results = [];
//         const batchSize = 20000; // Set your desired batch size
//         const batchObjectId = req.query.batchId ? helper.objectId(req.query.batchId) : helper.objectId(helper.stringObjectId());
//         const clientObjectId = helper.objectId(req.query.clientId);
//         const groupObjectId = helper.objectId(req.query.groupId);

//         try {
//           const data1 = await gstRepo.checkExists(month, year, type, clientObjectId, groupObjectId, batchObjectId);

//           if (data1 > 0) {
//             await gstRepo.updateIsActiveFalse(month, year, type, clientObjectId, groupObjectId, batchObjectId);
//           }

//           const transformStream = new stream.Transform({
//             objectMode: true,
//             transform: async function (data, encoding, callback) {
//               data = trimObjectKeys(data);
//               let parsed = moment(data["DATE"].trim(), dateFormats, true);
//               let parsedDate = parsed.isValid() ? parsed.format("DD-MM-YYYY") : data["DATE"].trim();

//               if (
//                 data["GSTIN"].toString().trim() !== "" ||
//                 data["IGST"].toString().trim().replace(/,/g, "") !== "" ||
//                 data["CGST"].toString().trim().replace(/,/g, "") !== "" ||
//                 data["SGST"].toString().trim().replace(/,/g, "") !== ""
//               ) {
//                 const map = {
//                   gstIn: data["GSTIN"].toString().trim(),
//                   date: data["DATE"].toString().trim(),
//                   newDate: parsedDate,
//                   taxableValue: data["TAXABLE VALUE"].toString().trim().replace(/,/g, ""),
//                   igst: data["IGST"].toString().trim().replace(/,/g, ""),
//                   cgst: data["CGST"].toString().trim().replace(/,/g, ""),
//                   sgst: data["SGST"].toString().trim().replace(/,/g, ""),
//                   invoiceNumber: data["INVOICE NUMBER"].toString().trim().replace(/^[\'"\.]+|[\'"\.]+$/g, ""),
//                   type: req.query.type,
//                   templeteId: helper.objectId(helper.stringObjectId()),
//                   isActive: true,
//                   insertedAt: helper.indian_time(),
//                   updatedAt: helper.indian_time(),
//                   gstInMatched: false,
//                   dateMatched: false,
//                   taxableValueMatched: false,
//                   igstMatched: false,
//                   cgstMatched: false,
//                   sgstMatched: false,
//                   invoiceNumberMatched: false,
//                   batchId: batchObjectId,
//                   allMatched: false,
//                   allMisMatched: false,
//                   editId: helper.stringObjectId().toString(),
//                   newInvoiceNumber: data["INVOICE NUMBER"].trim().replace(/^[.,'"\s]+|[.,'"\s]+$/g, "").toLowerCase().replace(/^0+/, ""),
//                   totalSumAmount: parseFloat(handleNaN(data["IGST"].toString().trim().replace(/,/g, ""))) +
//                     parseFloat(handleNaN(data["CGST"].toString().trim().replace(/,/g, ""))) +
//                     parseFloat(handleNaN(data["SGST"].toString().trim().replace(/,/g, ""))),
//                 };

//                 delete data.GSTIN;
//                 delete data.DATE;
//                 delete data["TAXABLE VALUE"];
//                 delete data["INVOICE NUMBER"];
//                 delete data.IGST;
//                 delete data.CGST;
//                 delete data.SGST;

//                 const mergedData = _.merge({}, map, data);
//                 results.push(mergedData);
//               }

//               if (results.length === batchSize) {
//                 // Process the batch
//                 await processBatch(req, res, results, batchObjectId);
//                 results.length = 0; // Clear the batch
//               }

//               callback();
//             },
//             flush: async function (callback) {
//               // Ensure the stream is fully flushed
//               if (results.length > 0) {
//                 await processBatch(req, res, results, batchObjectId);
//               }
//               res.status(201).json({ batchId: batchObjectId.toString() });
//               callback();
//             },
//           });

//           const readStream = new stream.Readable();
//           readStream.push(req.file.buffer.toString('utf8'));
//           readStream.push(null);

//           const csvStream = readStream.pipe(csv.parse({ headers: true }));
//           csvStream.pipe(transformStream);
//           resolve();
//         } catch (error) {
//           console.error("Error processing CSV data:", error);
//           reject("Error processing CSV data");
//         }
//       });
//     });
//   } catch (error) {
//     console.error("Error during file upload:", error);
//     res.status(500).send("Error during file upload");
//   }
// };


// const batchSize = 25000;

// const gstData = (req, res) => {
//   upload(req, res, (err) => {
//     if (err) {
//       return res.status(400).send("Something went wrong!");
//     }

//     const dateFormats = [
//       "DD.MM.YYYY",
//       "DD/MM/YYYY",
//       "DD-MM-YYYY",
//       "D.M.YYYY",
//       "D/M/YYYY",
//       "D-M-YYYY",
//       "DD.M.YYYY",
//       "DD/M/YYYY",
//       "DD-M-YYYY",
//       "DD.MM.YY",
//       "DD/MM/YY",
//       "DD-MM-YY",
//       "D.M.YY",
//       "D/M/YY",
//       "D-M-YY",
//       "DD.M.YY",
//       "DD/M/YY",
//       "DD-M-YY",
//       "YYYY-MMMM-DD",
//       "YYYY-MMM-DD",
//       "DD-MMM-YY",
//     ];

//     const results = [];
//     const batchObjectId = req.query.batchId ? helper.objectId(req.query.batchId) : helper.objectId(helper.stringObjectId());
//     gstRepo
//       .checkExists(month, year, type, clientObjectId, groupObjectId, batchObjectId)
//       .then((data1) => {
//         // console.log("hi")
//         if (data1 > 0) {
//           gstRepo.updateIsActiveFalse(
//             month,
//             year,
//             type,
//             clientObjectId,
//             groupObjectId,
//             batchObjectId
//           )

//         }
//         const transformStream = new stream.Transform({
//           objectMode: true,
//           transform: function (data, encoding, callback) {
//             data = trimObjectKeys(data);
//             let parsed = moment(data["DATE"].trim(), dateFormats, true);
//             let parsedDate = parsed.isValid() ? parsed.format("DD-MM-YYYY") : data["DATE"].trim();

//             if (
//               data["GSTIN"].toString().trim() !== "" ||
//               data["IGST"].toString().trim().replace(/,/g, "") !== "" ||
//               data["CGST"].toString().trim().replace(/,/g, "") !== "" ||
//               data["SGST"].toString().trim().replace(/,/g, "") !== ""
//             ) {
//               const map = {
//                 gstIn: data["GSTIN"].toString().trim(),
//                 date: data["DATE"].toString().trim(),
//                 newDate: parsedDate,
//                 taxableValue: data["TAXABLE VALUE"].toString().trim().replace(/,/g, ""),
//                 igst: data["IGST"].toString().trim().replace(/,/g, ""),
//                 cgst: data["CGST"].toString().trim().replace(/,/g, ""),
//                 sgst: data["SGST"].toString().trim().replace(/,/g, ""),
//                 invoiceNumber: data["INVOICE NUMBER"].toString().trim().replace(/^[\'"\.]+|[\'"\.]+$/g, ""),
//                 type: req.query.type,
//                 templeteId: helper.objectId(helper.stringObjectId()),
//                 isActive: true,
//                 insertedAt: helper.indian_time(),
//                 updatedAt: helper.indian_time(),
//                 gstInMatched: false,
//                 dateMatched: false,
//                 taxableValueMatched: false,
//                 igstMatched: false,
//                 cgstMatched: false,
//                 sgstMatched: false,
//                 invoiceNumberMatched: false,
//                 batchId: batchObjectId,
//                 allMatched: false,
//                 allMisMatched: false,
//                 editId: helper.stringObjectId().toString(),
//                 newInvoiceNumber: data["INVOICE NUMBER"].trim().replace(/^[.,'"\s]+|[.,'"\s]+$/g, "").toLowerCase().replace(/^0+/, ""),
//                 totalSumAmount: parseFloat(handleNaN(data["IGST"].toString().trim().replace(/,/g, ""))) +
//                   parseFloat(handleNaN(data["CGST"].toString().trim().replace(/,/g, ""))) +
//                   parseFloat(handleNaN(data["SGST"].toString().trim().replace(/,/g, ""))),
//               };

//               delete data.GSTIN;
//               delete data.DATE;
//               delete data["TAXABLE VALUE"];
//               delete data["INVOICE NUMBER"];
//               delete data.IGST;
//               delete data.CGST;
//               delete data.SGST;

//               const mergedData = _.merge({}, map, data);
//               results.push(mergedData);
//             }
//             // console.log(results.length)
//             if (results.length === batchSize) {
//               // Process the batch
//               processBatch(req, res, results, batchObjectId);
//               results.length = 0; // Clear the batch
            
//             }

//             callback();
//           },
          
//         });
//         console.log(transformStream)
//         const readStream = new stream.Readable();
//         readStream.push(req.file.buffer.toString('utf8'));
//         readStream.push(null);

//         const csvStream = readStream.pipe(csv.parse({ headers: true }));
//         csvStream.pipe(transformStream);

//         csvStream.on('end', async () => {
//           console.log("hi")
//           try {
//             // Process any remaining data
//             if (results.length > 0) {
//               console.log(results.length);
//               await processBatch(req, res, results, batchObjectId);
//               res.status(201).json({ batchId: batchObjectId.toString() });
//             }
//           } catch (error) {
//             console.error("Error processing remaining data:", error);
//             res.status(500).send("Error processing remaining data");
//           }
//         });
       
//       });
//   })
// };


const processBatch = async (req, res, result, batchObjectId) => {
  // Your logic for processing a batch
  // For example, if inserting into a database
  console.log(result.length);
  try {
    const clientObjectId = helper.objectId(req.query.clientId);
    const groupObjectId = helper.objectId(req.query.groupId);

    await gstHandler.gstData(
      result,
      req.query.type,
      res,
      batchObjectId,
      req.query.month,
      req.query.year,
      clientObjectId,
      groupObjectId
    );
  } catch (error) {
    console.error("Error processing CSV data:", error);
    res.status(500).send("Error processing CSV data");
  }
};






























































// compare/csv/data?batchId
const compareGstData = (req, res) => {
  if (req.query.batchId == "" || !req.query.batchId) {
    return res
      .status(400)
      .send({ error: "Batch ID Not found", statusCode: 400 });
  }
  batchObjectId = helper.objectId(req.query.batchId);
  gstHandler.compareGstDataNew(batchObjectId, res);
};

// get/compared/csv/data
const getComparedData = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  ////req.params.batch_id)
  switch (req.query.type) {
    case "all":
      gstHandler.getMatchedDataAll(batchObjectId, res);
      break;
    case "matched":
      gstHandler.getMatchedDataAllMatched(batchObjectId, res);
      break;
    case "probable":
      gstHandler.getMatchedDataAllProbable(batchObjectId, res);
      break;
    case "manual":
      gstHandler.getMatchedDataAllManual(batchObjectId, res);
      break;
    case "notmatched":
      gstHandler.getNotMached(batchObjectId, res);
      break;
    case "manualmatched":
      gstHandler.getManualMatched(batchObjectId, res);
      break;
    default:
      gstHandler.partialMatched(batchObjectId, res);
      break;
  }
};

///batch/:batch_id/get/template/data
const getTemplateData = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  type = req.query.type;
  page = req.query.page;
  gstHandler.getTemplateData(batchObjectId, res, type, page);
};

//"/batch/:batch_id/move/data"
const moveData = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  type = req.query.type;
  if (req.body.register.length == 0) {
    res.status(400).send({
      errors: `Cannot Be Empty`,
      status: 400,
    });
  } else {
    const purchaseRegister = req.body.register;
    const matchedUserId = req.userData["_id"];
    gstHandler.moveData(
      batchObjectId,
      res,
      type,
      purchaseRegister,
      matchedUserId
    );
  }
};

const getMatchNumber = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  gstHandler.getMatchNumber(res, batchObjectId)
};

//"/get/batchid"
const getBatchId = (req, res) => {
  month = req.query.month;
  year = req.query.year;
  type = req.query.type;
  clientObjectId = helper.objectId(req.query.clientId);
  groupObjectId = helper.objectId(req.query.groupId);
  // console.log(clientObjectId)
  gstHandler.getBatchId(res, month, year, type, clientObjectId, groupObjectId);
};

const probabilityAdd = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  gstHandler.compareGstDataNewProbability(batchObjectId, res);
};

const approveGstData = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  const matchedUserId = req.userData["_id"];
  gstHandler.approveGstData(batchObjectId, res, matchedUserId);
};

const getGstin = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  let groupObjectId = helper.objectId(req.query.groupId);
  gstHandler.getGstin(batchObjectId, res, groupObjectId);
};

const probabilityAddGstin = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  let gstIn = req.query.gstIn;
  gstHandler.probabilityAddGstin(batchObjectId, res, gstIn);
};

const probabilityExistsGstin = (req, res) => {
  batchObjectId = helper.objectId(req.params.batch_id);
  let gstIn = req.query.gstIn;
  let type = req.query.type;
  gstHandler.probabilityExistsGstin(batchObjectId, res, gstIn, type);
};

function handleNaN(value) {
  if (isNaN(value) || value == '' || value == " ") {
    return 0;
  } else {
    return value;
  }
}

function trimObjectKeys(obj) {
  const trimmedObject = {};
  for (let key in obj) {
    if (key != '') {
      key = key.replace(/\./g, "_");
      if (obj.hasOwnProperty(key)) {
        const trimmedKey = key.trim();
        // console.log(trimmedKey)
        trimmedObject[trimmedKey] = obj[key];
      }
    }

  }
  return trimmedObject;
}


const deleteOldData = async (req, res) => {
  type = req.query.type;
  clientObjectId = helper.objectId(req.query.clientId);
  groupObjectId = helper.objectId(req.query.groupId);
  batchObjectId = helper.objectId(req.params.batch_id);
  await gstRepo.updateIsActiveFalse(type, clientObjectId, groupObjectId, batchObjectId)
  res.status(200).send("Delete Old Template Data batchId " + batchId +" type "+type);
}
module.exports = {
  gstData,
  compareGstData,
  getComparedData,
  getTemplateData,
  moveData,
  getBatchId,
  probabilityAdd,
  approveGstData,
  getGstin,
  probabilityAddGstin,
  probabilityExistsGstin,
  getMatchNumber,
  deleteOldData
};
