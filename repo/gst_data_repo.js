const helper = require("../helpers");

const dbConnection = require("../db");
const { filter } = require("lodash");

const template1 = dbConnection.collection("template_one_gst");

const template2 = dbConnection.collection("template_two_gst");

const gstNumberData = dbConnection.collection("gst_number_data")

const gstData = (data, type) => {
  if (type == "templateOne") {
    return template1.insertMany(data);
  } else {
    return template2.insertMany(data);
  }
};

const compareGstData = (batchObjectId) => {
  const filter = {
    batchId: batchObjectId,
    isActive: true,
    allMatched: false,
  };
  project = {
    gstInMatched: 0,
    cgstMatched: 0,
    igstMatched: 0,
    dateMatched: 0,
    taxableValueMatched: 0,
    sgstMatched: 0,
    invoiceNumberMatched: 0,
    insertedAt: 0,
    updatedAt: 0,
    isActive: 0,
  };
  return template1
    .find(filter, { projection: project, sort: { _id: 1 } })
    .toArray();
};

const gstTempleteTwoData = (batchObjectId, gstIn, invoiceNumber) => {
  const filter = {
    batchId: batchObjectId,
    isActive: true,
    gstIn: gstIn,
    invoiceNumber: invoiceNumber,
    $and: [{ invoiceNumberMatched: false }, { allMatched: false }],
  };
  project = {
    gstInMatched: 0,
    cgstMatched: 0,
    igstMatched: 0,
    dateMatched: 0,
    taxableValueMatched: 0,
    sgstMatched: 0,
    invoiceNumberMatched: 0,
    insertedAt: 0,
    updatedAt: 0,
    isActive: 0,
  };
  // //console.log(template2.find(filter, {projection: project, sort: {_id: 1}}).toArray())
  return template2
    .find(filter, { projection: project, sort: { _id: 1 } })
    .toArray();
};

const gstTempleteData = async (batchObjectId) => {
  const filter = {
    batchId: batchObjectId,
    isActive: true,
  };
  project = {
    _id: 0,
    isActive: 0,
  };
  try {
    let templateOneData = await template1
      .find(filter, { projection: project })
      .toArray();
    let templateTwoData = await template2
      .find(filter, { projection: project })
      .toArray();
    return [...templateOneData, ...templateTwoData];
  } catch (error) {
    // Handle error
    console.error("An error occurred:", error);
    throw error;
  }
};

const gstTempleteTwoDataDate = (batchObjectId, gstIn, date) => {
  const filter = {
    batchId: batchObjectId,
    isActive: true,
    gstIn: gstIn,
    newDate: date,
    allMatched: false,
    $or: [{ invoiceNumberMatched: false }, { dateMatched: false }],
  };
  project = {
    gstInMatched: 0,
    cgstMatched: 0,
    igstMatched: 0,
    dateMatched: 0,
    taxableValueMatched: 0,
    sgstMatched: 0,
    // invoiceNumberMatched: 0,
    insertedAt: 0,
    updatedAt: 0,
    isActive: 0,
  };
  return template2.find(filter, { projection: project }).toArray();
};

const setDataTwoTemplate = async (
  gstIn,
  templateOneData,
  templateTwoData,
  batchObjectId,
  templateOneLength,
  templateTwoLength
) => {
  const filter = {
    batchId: batchObjectId,
    gstIn: gstIn,
    isActive: true,
  };
  update = {
    $set: {
      gstInData: templateOneData,
      gstInDataLength: templateOneLength,
      compared: true
    },
  };
  update1 = {
    $set: {
      gstInData: templateTwoData,
      gstInDataLength: templateTwoLength,
      compared: true
    },
  };

  try {
   await  template1.updateOne(filter, update);
   await template2.updateOne(filter, update1);
    // return [...templateOneData, ...templateTwoData];
  } catch (error) {
    // Handle error
    console.error("An error occurred:", error);
    throw error;
  }
};

const setDataTempOne = async (
  gstIn,
  templateOneData,
  batchObjectId,
  templateOneLength
) => {
  const filter = {
    batchId: batchObjectId,
    gstIn: gstIn,
    isActive: true,
  };
  update = {
    $set: {
      gstInData: templateOneData,
      gstInDataLength: templateOneLength,
      compared: true
    },
  };
  // update1 = {
  //   $set: {
  //     gstInData: templateTwoData,
  //   },
  // };

  try {
    await template1.updateOne(filter, update);
    //   template2.updateOne(filter, update1);
    // return [...templateOneData, ...templateTwoData];
  } catch (error) {
    // Handle error
    console.error("An error occurred:", error);
    throw error;
  }
};

const setDataTempTwo = async (gstIn, templateTwoData, batchObjectId) => {
  const filter = {
    batchId: batchObjectId,
    gstIn: gstIn,
    isActive: true,
  };
  // update = {
  //   $set: {
  //     gstInData: templateOneData,
  //   },
  // };
  update1 = {
    $set: {
      gstInData: templateTwoData,
      compared: true
    },
  };

  try {
    //   template1.updateOne(filter, update);
   await template2.updateOne(filter, update1);
    // return [...templateOneData, ...templateTwoData];
  } catch (error) {
    // Handle error
    console.error("An error occurred:", error);
    throw error;
  }
};

const gstDataSet = (
  batchObjectId,
  template_one_id,
  template_two_id,
  key1,
  key2,
  referenceId,
  allMatched
) => {
  filter1 = {
    batchId: batchObjectId,
    isActive: true,
    templeteId: template_one_id,
  };
  filter2 = {
    batchId: batchObjectId,
    isActive: true,
    templeteId: template_two_id,
  };
  let update = {};
  let update1 = {};
  let pushDoc = {};
  update[key1] = true;
  update[key2] = true;
  update1[key1] = true;
  update1[key2] = true;
  if (referenceId) {
    pushDoc["referenceTemplateId"] = template_one_id;
    update["matched"] = true;
  } else {
    (update1["referenceTemplateId"] = template_one_id),
      (update1["matched"] = true);
    update["matched"] = true;
  }
  if (allMatched) {
    update["allMatched"] = true;
    update1["allMatched"] = true;
  }
  update3 = {
    $set: update,
  };
  let update4 = {
    $set: update1,
  };
  if (pushDoc) {
    update4["$push"] = pushDoc;
  } else {
    update4;
  }
  // //console.log("filter1" ,filter1)
  // //console.log("filter2" ,filter2)
  // //console.log("up3" ,update3)
  // //console.log("up42" ,update4)
  template1.updateOne(filter1, update3);
  return template2.updateOne(filter2, update4);
};

const setOtherParameter = (
  batchObjectId,
  template_one_id,
  template_two_id,
  key
) => {
  filter1 = {
    batchId: batchObjectId,
    isActive: true,
    templeteId: template_one_id,
  };
  filter2 = {
    batchId: batchObjectId,
    isActive: true,
    templeteId: template_two_id,
  };
  let update = {};
  update[key] = true;
  update1 = {
    $set: update,
  };
  template1.updateOne(filter1, update1);
  return template2.updateOne(filter2, update1);
};

// const getMatchedDataAll = async (batchObjectId) => {
//   const filter = {
//     batchId: batchObjectId,
//     isActive: true,
//     allMatched: true,
//   };
//   project = {
//     _id: 0,
//     insertedAt: 0,
//     updatedAt: 0,
//     isActive: 0,
//   };

//   try {
//     let templateOneData = await template1
//       .find(filter, { projection: project, sort: { templateId: 1 } })
//       .toArray();
//     let templateTwoData = await template2
//       .find(filter, { projection: project, sort: { referenceTemplateId: 1 } })
//       .toArray();
//     return [...templateOneData, ...templateTwoData];
//   } catch (error) {
//     // Handle error
//     console.error("An error occurred:", error);
//     throw error;
//   }
// };

const getMatchedDataAll = async (batchObjectId) => {
  try {
    const filter = {
      batchId: batchObjectId,
      isActive: true,
      $or: [
        { "gstInData.allMatched": true },
        {
          "$and": [
            { "gstInData.igstMatched": true },
            { "gstInData.cgstMatched": true },
            { "gstInData.sgstMatched": true },
            { "gstInData.invoiceNumberMatched": true },
            { "gstInData.gstInMatched": true },
            // {"gstInData.dateMatched": true},
          ]
        }

      ]
    };
    const addFields = {
      gstInData: {
        $filter: {
          input: "$gstInData",
          cond: {
            $or: [
              { $eq: ["$$this.allMatched", true] },
              {
                $and: [
                  { $eq: ["$$this.igstMatched", true] },
                  { $eq: ["$$this.cgstMatched", true] },
                  { $eq: ["$$this.sgstMatched", true] },
                  { $eq: ["$$this.invoiceNumberMatched", true] },
                  { $eq: ["$$this.gstInMatched", true] },
                  // { $eq: ["$$this.dateMatched", true] },
                ]
              }
            ]
          }
        },
      },
    };
    const project = {
      _id: 0,
      gstInData: 1,
    };
    const pipeline = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
    ];
    const pipeline2 = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project }
    ];
    let templateOneData = await template1.aggregate(pipeline).toArray();
    let templateTwoData = await template2.aggregate(pipeline2).toArray();

    return [...templateOneData, ...templateTwoData];
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching fee payments." });
  }
};



const getMatchedDataAllMatched = async (batchObjectId) => {
  try {
    const filter = {
      batchId: batchObjectId,
      isActive: true,
      $or: [
        { "gstInData.allMatched": true },
        {
          "$and": [
            { "gstInData.igstMatched": true },
            { "gstInData.cgstMatched": true },
            { "gstInData.sgstMatched": true },
            { "gstInData.invoiceNumberMatched": true },
            { "gstInData.gstInMatched": true },
            { "gstInData.probable": { "$exists": false } },
            { "gstInData.manualMatched": { "$exists": false } },
          ]
        }

      ]
    };
    const addFields = {
      gstInData: {
        $filter: {
          input: "$gstInData",
          cond: {
            $or: [
              { $eq: ["$$this.allMatched", true] },
              {
                $and: [
                  { $eq: ["$$this.igstMatched", true] },
                  { $eq: ["$$this.cgstMatched", true] },
                  { $eq: ["$$this.sgstMatched", true] },
                  { $eq: ["$$this.invoiceNumberMatched", true] },
                  { $eq: ["$$this.gstInMatched", true] },
                  { $eq: [{ $ifNull: ["$$this.probable", false] }, false] },
                  { $eq: [{ $ifNull: ["$$this.manualMatched", false] }, false] }
                  // { $eq: ["$$this.dateMatched", true] },
                ]
              }
            ]
          }
        },
      },
    };
    const project = {
      _id: 0,
      gstInData: 1,
    };
    const pipeline = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },

      // //{ $sort: { "gstInData.templeteId": 1 } },
    ];
    const pipeline2 = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      // //{ $sort: { "gstInData.referenceTemplateId": 1 } },
    ];
    let templateOneData = await template1.aggregate(pipeline).toArray();
    let templateTwoData = await template2.aggregate(pipeline2).toArray();

    return [...templateOneData, ...templateTwoData];
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching fee payments." });
  }
};


// const getMatchedDataAllMatched = async (batchObjectId) => {
//   try {
//     const filter = {
//       batchId: batchObjectId,
//       isActive: true,
//       $or: [
//         { "gstInData.allMatched": true },
//         {
//           "$and": [
//             { "gstInData.igstMatched": true },
//             { "gstInData.cgstMatched": true },
//             { "gstInData.sgstMatched": true },
//             { "gstInData.invoiceNumberMatched": true },
//             { "gstInData.gstInMatched": true },
//             { "gstInData.probable": { "$exists": false } },
//             { "gstInData.manualMatched": { "$exists": false } },
//           ]
//         }
//       ]
//     };

//     const addFields = {
//       gstInData: {
//         $filter: {
//           input: "$gstInDataArray", // Change to the new field
//           cond: {
//             $or: [
//               { $eq: ["$$this.allMatched", true] },
//               {
//                 $and: [
//                   { $eq: ["$$this.igstMatched", true] },
//                   { $eq: ["$$this.cgstMatched", true] },
//                   { $eq: ["$$this.sgstMatched", true] },
//                   { $eq: ["$$this.invoiceNumberMatched", true] },
//                   { $eq: ["$$this.gstInMatched", true] },
//                   { $eq: [{ $ifNull: ["$$this.probable", false] }, false] },
//                   { $eq: [{ $ifNull: ["$$this.manualMatched", false] }, false] }
//                 ]
//               }
//             ]
//           }
//         },
//       },
//     };

//     const project = {
//       _id: 0,
//       gstInData: 1,
//     };

//     const pipeline = [
//       { $match: filter },
//       {
//         $addFields: {
//           gstInDataArray: {
//             $cond: {
//               if: { $isArray: "$gstInData" },
//               then: "$gstInData",
//               else: ["$gstInData"]
//             }
//           }
//         }
//       },
//       { $unwind: "$gstInData" },
//       { $addFields: addFields },
//       { $project: project },
//     ];

//     const skip = (parseInt(page) - 1) * batchSize;

//     let aggregatedData = [];

//     // Using Promise.all to run both template1 and template2 aggregate queries concurrently
//     const [batchResult1, batchResult2] = await Promise.all([
//       template1.aggregate([...pipeline, { $skip: skip }, { $limit: batchSize }]).toArray(),
//       template2.aggregate([...pipeline, { $skip: skip }, { $limit: batchSize }]).toArray()
//     ]);

//     if (batchResult1.length === 0 && batchResult2.length === 0) {
//       // No more data to process
//       return aggregatedData;
//     }

//     aggregatedData = [...aggregatedData, ...batchResult1, ...batchResult2];

//     return aggregatedData;
//   } catch (err) {
//     console.error(err);
//     throw new Error("An error occurred while fetching data.");
//   }
// };

const getMatchedDataAllManual = async (batchObjectId) => {
  try {
    const filter = {
      batchId: batchObjectId,
      isActive: true,
      $and: [
        { "gstInData.allMatched": true },
        { "gstInData.manualMatched": { "$exists": true } }
      ]
    };
    const addFields = {
      gstInData: {
        $filter: {
          input: "$gstInData",
          cond: {
            $and: [
              { $eq: ["$$this.allMatched", true] },
              { $eq: ["$$this.manualMatched", true] },
            ]
          }
        },
      },
    };
    const project = {
      _id: 0,
      gstInData: 1,
    };
    const pipeline = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      // //{ $sort: { "gstInData.templeteId": 1 } },
    ];
    const pipeline2 = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      // //{ $sort: { "gstInData.referenceTemplateId": 1 } },
    ];
    let templateOneData = await template1.aggregate(pipeline).toArray();
    let templateTwoData = await template2.aggregate(pipeline2).toArray();

    return [...templateOneData, ...templateTwoData];
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching fee payments." });
  }
};

const getMatchedDataAllProbable = async (batchObjectId) => {
  try {
    const filter = {
      batchId: batchObjectId,
      isActive: true,
      $and: [
        { "gstInData.allMatched": true },
        { "gstInData.probable": { "$exists": true } }
      ]
    };
    const addFields = {
      gstInData: {
        $filter: {
          input: "$gstInData",
          cond: {
            $and: [
              { $eq: ["$$this.allMatched", true] },
              { $eq: ["$$this.probable", true] },
            ]
          }
        },
      },
    };
    const project = {
      _id: 0,
      gstInData: 1,
    };
    const pipeline = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      // //{ $sort: { "gstInData.templeteId": 1 } },
    ];
    const pipeline2 = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      // //{ $sort: { "gstInData.referenceTemplateId": 1 } },
    ];
    let templateOneData = await template1.aggregate(pipeline).toArray();
    let templateTwoData = await template2.aggregate(pipeline2).toArray();

    return [...templateOneData, ...templateTwoData];
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching fee payments." });
  }
};

const getNotMached = async (batchObjectId) => {
  try {
    const filter = {
      batchId: batchObjectId,
      isActive: true,
      $and: [
        { "gstInData.allMatched": false },
        {
          "$or": [
            { "gstInData.igstMatched": false },
            { "gstInData.cgstMatched": false },
            { "gstInData.sgstMatched": false },
            { "gstInData.invoiceNumberMatched": false },
            { "gstInData.gstInMatched": false },
            // {"gstInData.dateMatched": false},
          ]
        }

      ]
    };
    const addFields = {
      gstInData: {
        $filter: {
          input: "$gstInData",
          cond: {
            $and: [
              { $eq: ["$$this.allMatched", false] },
              {
                $or: [
                  { $eq: ["$$this.igstMatched", false] },
                  { $eq: ["$$this.cgstMatched", false] },
                  { $eq: ["$$this.sgstMatched", false] },
                  { $eq: ["$$this.invoiceNumberMatched", false] },
                  { $eq: ["$$this.gstInMatched", false] },
                  // { $eq: ["$$this.dateMatched", false] },
                ]
              }
            ]
          },
        },
      },
    };
    const project = {
      _id: 0,
      gstInData: 1,
    };
    const pipeline = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      //{ $sort: { "gstInData.templeteId": 1 } },
    ];
    const pipeline2 = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      //{ $sort: { "gstInData.referenceTemplateId": 1 } },
    ];
    let templateOneData = await template1.aggregate(pipeline).toArray();
    let templateTwoData = await template2.aggregate(pipeline2).toArray();
    // return comapreData(templateOneData, templateTwoData)
    return [...templateOneData, ...templateTwoData];
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching fee payments." });
  }
};

const partialMatched = async (batchObjectId) => {
  const filter = {
    batchId: batchObjectId,
    isActive: true,
    $or: [
      {
        $and: [
          {
            type: "template2",
          },
          {
            referenceTemplateId: {
              $exists: true,
            },
          },
          {
            matched: true,
          },
          {
            allMatched: false,
          },
        ],
      },
      {
        $and: [
          {
            type: "template1",
          },
          {
            matched: true,
          },
          {
            allMatched: false,
          },
        ],
      },
    ],
  };
  project = {
    _id: 0,
    insertedAt: 0,
    updatedAt: 0,
    isActive: 0,
  };

  try {
    let templateOneData = await template1
      .find(filter, { projection: project, sort: { templateId: 1 } })
      .toArray();
    let templateTwoData = await template2
      .find(filter, { projection: project, sort: { referenceTemplateId: 1 } })
      .toArray();
    return [...templateOneData, ...templateTwoData];
  } catch (error) {
    // Handle error
    console.error("An error occurred:", error);
    throw error;
  }
};


// function comapreData(templateOne, templateTwo){
//   let newTemplateOne = []
//   let newTemplateTwo = []
//   let newSortedTemplateData = []
//   templateOne.forEach((element) => {
//     newTemplateOne.push(...element.gstInData);
//   });
//   templateTwo.forEach((element) => {
//     newTemplateTwo.push(...element.gstInData);
//   });
//   newTemplateOne.forEach(element =>{
//     let equalMatched = newTemplateTwo.filter(
//       (element_3) => element_3.referenceTemplateId == element.templeteId
//     );
//     let notMatched = newTemplateTwo.filter(
//       (element_3) => element_3.referenceTemplateId == undefined || element_3.referenceTemplateId != element.templeteId
//     );
//     newSortedTemplateData.push(...[element],...equalMatched, ...notMatched)
//   })
//   return newSortedTemplateData
// }


// const getTemplateData = async (batchObjectId, type, page) => {
//   let filter = {};
//   if (page == "page") {
//     filter = {
//       batchId: batchObjectId,
//       isActive: true,
//     };
//   } else {
//     filter = {
//       batchId: batchObjectId,
//       isActive: true,
//       _id: {
//         $gt: helper.objectId(page),
//       },
//     };
//   }
//   project = {
//     insertedAt: 0,
//     updatedAt: 0,
//     isActive: 0,
//   };
//   if (type == "templateOne") {
    
//     return await template1
//       .find(filter, { projection: project, sort: { _id: 1 } })
//       .toArray();
//   } else {
//     return await template2
//       .find(filter, { projection: project, sort: { _id: 1 } })
//       .toArray();
//   }
// };


const getTemplateData = async (batchObjectId, type, batchSize, totalLimit) => {
  const collection = type === "templateOne" ? template1 : template2;

  const pipeline = [
    {
      $match: {
        batchId: batchObjectId,
        isActive: true,
      },
    },
    {
      $unwind: "$gstInData", 
    },
    {
      $project: {
        insertedAt: 0,
        updatedAt: 0,
        isActive: 0,
      },
    }
    // ,
    // {
    //   $limit: totalLimit,
    // },
  ];

  const cursor = collection.aggregate(pipeline, { batchSize: batchSize });
 
  try {
    const results = [];
   
    while (await cursor.hasNext()) {
      //  console.log(await cursor.hasNext())
      const doc = await cursor.next();
      // console.log(doc)
      if (!doc) {
        break;
      }
      results.push(doc);
    }
    return results;
  } finally {
    await cursor.close();
  }
};

// const matchData = (gstIn, batchObjectId, editId, invoiceNumber, type) => {
//   const filter = {
//     "gstIn": gstIn,
//     "batchId": batchObjectId,
//     "isActive": true,
//     "gstInData.editId": editId
//   }
//   // //console.log(filter)
//   update = {
//     "$set":{
//       "gstInData.$.allMatched": true,
//       "gstInData.$.newInvoiceNumber": invoiceNumber
//     }
//   }
//   if (type == "template1") {
//     template1.updateOne(filter,update)
//   } else {
//     template2.updateOne(filter,update)
//   }

// };

const matchData = (gstIn, editId, referenceTemplateId, newInvoiceNumber, type, batchObjectId, matchedUserId, manualMatched, element) => {
  let update;
  const filter = {
    "gstIn": gstIn,
    "batchId": batchObjectId,
    "isActive": true,
    "gstInData.editId": editId
  }
  // //console.log(manualMatched)
  if (type == "templateOne") {
    if (manualMatched == true) {
      update = {
        "$set": {
          "gstInData.$.allMatched": true,
          "gstInData.$.newInvoiceNumber": newInvoiceNumber,
          "gstInData.$.templeteId": helper.objectId(element.templeteId),
          // "gstInData.$.probable": true,
          "gstInData.$.matchedUserId": matchedUserId,
          "gstInData.$.manualMatched": true,
          "gstInData.$.typeMatch": element.typeMatch
        }
      }
    } else {
      update = {
        "$set": {
          "gstInData.$.allMatched": true,
          "gstInData.$.newInvoiceNumber": newInvoiceNumber,
          "gstInData.$.referenceTemplateId": helper.objectId(element.referenceTemplateId),
          "gstInData.$.probable": true,
          "gstInData.$.matchedUserId": matchedUserId,
          "gstInData.$.typeMatch": element.typeMatch
          // "gstInData.$.manualMatched": false
        }
      }
    }

  } else {
    //console.log(manualMatched)
    if (manualMatched == true) {
      update = {
        "$set": {
          "gstInData.$.allMatched": true,
          "gstInData.$.newInvoiceNumber": newInvoiceNumber,
          "gstInData.$.referenceTemplateId": referenceTemplateId,
          // "gstInData.$.probable": true,
          "gstInData.$.matchedUserId": matchedUserId,
          "gstInData.$.manualMatched": true,
          "gstInData.$.typeMatch": element.typeMatch
        }
      }
    } else {
      update = {
        "$set": {
          "gstInData.$.allMatched": true,
          "gstInData.$.newInvoiceNumber": newInvoiceNumber,
          "gstInData.$.referenceTemplateId": referenceTemplateId,
          "gstInData.$.probable": true,
          "gstInData.$.matchedUserId": matchedUserId,
          "gstInData.$.typeMatch": element.typeMatch
          // "gstInData.$.manualMatched": false
        }
      }
    }

  }

  // //console.log(filter)
  // //console.log(update)
  if (type == "templateOne") {
    template1.updateOne(filter, update)
  } else {
    template2.updateOne(filter, update)
  }

};


const updateNumbers = (batchObjectId, type) => {
  const filter = {
    batchId: batchObjectId,
    isActive: true
  }
  update = {
    "$inc": {
      type: 1
    }
  }
  gstNumberData.updateOne(filter, update);
}

const getBatchId = (month, year, type, clientObjectId, groupObjectId) => {
  //console.log(typeof(clientObjectId))
  const filter = {
    month: month,
    year: year,
    clientId: clientObjectId,
    groupId: groupObjectId,
    isActive: true,
  }
  // //console.log(filter)
  project = {
    batchId: 1,
    compared: 1,
    isApproved: 1,
    _id: 0
  }
  if (type == "templateOne") {
    return template1.findOne(filter, { projection: project })
  } else {
    return template2.findOne(filter, { projection: project })
  }
}

const checkExists = (month, year, type, clientObjectId, groupObjectId, batchObjectId) => {
  const filter = {
    month: month,
    year: year,
    clientId: clientObjectId,
    groupId: groupObjectId,
    batchId: batchObjectId,
    isActive: true
  }
  project = {
    _id: 1
  }
  if (type == "templateOne") {
    return template1.countDocuments(filter, { projection: project });
  } else {
    return template2.countDocuments(filter, { projection: project });
  }
}


const updateIsActiveFalse = async (type, clientObjectId, groupObjectId, batchObjectId) => {
  const filter = {
    isActive: true,
    groupId: groupObjectId,
    clientId: clientObjectId,
    batchId: batchObjectId
  }
  update = {
    "$set": {
      "isActive": false
    }
  }
  if (type == "templateOne") {
    await template1.updateMany(filter, update);
  } else {
    await template2.updateMany(filter, update);
  }
}


const getAllMisMatchedData = async (batchObjectId) => {
  const filter = {
    batchId: batchObjectId,
    isActive: true,
    $and: [
      { "gstInData.igstMatched": false },
      { "gstInData.cgstMatched": false },
      { "gstInData.sgstMatched": false },
      { "gstInData.invoiceNumberMatched": false },
      { "gstInData.gstInMatched": false },
      { "gstInData.dateMatched": false },
      { "gstInData.taxableValueMatched": false },
      { "gstInData.allMatched": false },
    ]
  }
  addFields = {
    gstInData: {
      $filter: {
        input: "$gstInData",
        cond: {
          $and: [
            { $eq: ["$$this.igstMatched", false] },
            { $eq: ["$$this.cgstMatched", false] },
            { $eq: ["$$this.sgstMatched", false] },
            { $eq: ["$$this.invoiceNumberMatched", false] },
            { $eq: ["$$this.gstInMatched", false] },
            { $eq: ["$$this.dateMatched", false] },
            { $eq: ["$$this.taxableValueMatched", false] },
            { $eq: ["$$this.allMatched", false] },
          ]
        }
      },
    },
  };
  const project = {
    _id: 0,
    isActive: 0,

  };
  const pipeline = [
    { $match: filter },
    { $addFields: addFields },
    { $project: project },
  ];
  try {
    let templateOneData = await template1
      .aggregate(pipeline)
      .toArray();
    let templateTwoData = await template2
      .aggregate(pipeline)
      .toArray();
    return [...templateOneData, ...templateTwoData];
  } catch (error) {
    // Handle error
    console.error("An error occurred:", error);
    throw error;
  }
}


const getAllMisMatchedDataNew = async (batchObjectId, gstIn) => {
  let filter = {
    batchId: batchObjectId,
    gstIn: gstIn,
    isActive: true,
    probabilityMatched: false,
    $and: [
      { "gstInData.igstMatched": false },
      { "gstInData.cgstMatched": false },
      { "gstInData.sgstMatched": false },
      { "gstInData.invoiceNumberMatched": false },
      { "gstInData.gstInMatched": false },
      { "gstInData.dateMatched": false },
      { "gstInData.taxableValueMatched": false },
      { "gstInData.allMatched": false },
    ]
  }
  addFields = {
    gstInData: {
      $filter: {
        input: "$gstInData",
        cond: {
          $and: [
            { $eq: ["$$this.igstMatched", false] },
            { $eq: ["$$this.cgstMatched", false] },
            { $eq: ["$$this.sgstMatched", false] },
            { $eq: ["$$this.invoiceNumberMatched", false] },
            { $eq: ["$$this.gstInMatched", false] },
            { $eq: ["$$this.dateMatched", false] },
            { $eq: ["$$this.taxableValueMatched", false] },
            { $eq: ["$$this.allMatched", false] },
          ]
        }
      },
    },
  };
  const project = {
    _id: 0,
    isActive: 0,

  };
  const pipeline = [
    { $match: filter },
    { $addFields: addFields },
    { $project: project },
  ];
  try {
    let templateOneData = await template1
      .aggregate(pipeline)
      .toArray();
    let templateTwoData = await template2
      .aggregate(pipeline)
      .toArray();
    //console.log(templateTwoData)
    return [...templateOneData, ...templateTwoData];
  } catch (error) {
    // Handle error
    console.error("An error occurred:", error);
    throw error;
  }
}


const updateProbability = async (batchObjectId, gstIn) => {
  const filter = {
    batchId: batchObjectId,
    gstIn: gstIn,
    isActive: true,
    probabilityMatched: false,
  }
  // console.log(filter)
  update = {
    "$set": {
      probabilityMatched: true
    }
  }

  template1.updateOne(filter, update);
  template2.updateOne(filter, update);
}


const setProbabilityData = async (batchObjectId, data, type) => {
  filterNew = {
    "batchId": batchObjectId,
    "isActive": true,
    "gstIn": data.gstIn,
    "gstInData.editId": data.editId
  }
  // console.log(filter, type)
  // console.log(data)
  update = {
    "$set": {
      "gstInData.$": data
    }
  }
  
  try {
    if (type == "templateOne") {
      template1.updateOne(filterNew, update)
    } else {
      template2.updateOne(filterNew, update)
    }

  } catch (error) {
    //console.log(error)
  }
}


const approveGstData = async (batchObjectId, matchedUserId) => {
  const filter = {
    "batchId": batchObjectId,
    "isActive": true,
    "isApproved": false
  }
  if (type == "approve") {
    update = {
      "$set": {
        "isApprovedUserId": matchedUserId,
        "isApproved": true
      }
    }
  } else {
    update = {
      "$set": {
        "isApprovedUserId": matchedUserId,
        "isApproved": false
      }
    }
  }
  await template1.updateMany(filter, update)
  await template2.updateMany(filter, update)
}


const unMatchData = async (gstIn, editId, newInvoiceNumber, type, batchObjectId, matchedUserId, referenceTempleteId) => {
  let update;
  let filter = {
    "gstIn": gstIn,
    "batchId": batchObjectId,
    "isActive": true,
    "gstInData.editId": editId
  }
  if (type == "templateOne") {
    update = {
      $set: {
        'gstInData.$.allMatched': false,
        'gstInData.$.unMatchedUserId': matchedUserId,
        'gstInData.$.templeteId': helper.objectId(helper.stringObjectId())
      },
    }
  } else {
    update = {
      $set: {
        'gstInData.$.allMatched': false,
        'gstInData.$.unMatchedUserId': matchedUserId,
        'gstInData.$.templeteId': helper.objectId(helper.stringObjectId()),
        "gstInData.$.referenceTemplateId": ""
      },
    }
  }

  if (type == "templateOne") {
    await template1.updateOne(filter, update);
  } else {
    await template2.updateOne(filter, update);
  }

}


// const getGstin = async (batchObjectId, groupObjectId) => {
//   let filter = {
//     "batchId": batchObjectId,
//     "groupId": groupObjectId,
//     "isActive": true,
//     "probabilityExists": true,
//     "submitted": false
//   }
//   // ////console.log(filter)
//   let project = {
//     "gstIn": 1,
//     "type": 1,
//     "_id": 0,
//   }
//   try {
//     let templateOneData = await template1
//       .find(filter, { projection: project })
//       .toArray();
//     let templateTwoData = await template2
//       .find(filter, { projection: project })
//       .toArray();
//     return [...templateOneData, ...templateTwoData];
//   } catch (error) {
//     // Handle error
//     console.error("An error occurred:", error);
//     throw error;
//   }
// }

const getGstin = async (batchObjectId) => {
  try {
    const filter = {
      batchId: batchObjectId,
      isActive: true,
      $and: [
        { "gstInData.allMatched": false },
        {
          "$or": [
            { "gstInData.igstMatched": false },
            { "gstInData.cgstMatched": false },
            { "gstInData.sgstMatched": false },
            { "gstInData.invoiceNumberMatched": false },
            { "gstInData.gstInMatched": false },
            // {"gstInData.dateMatched": false},
          ]
        }

      ]
    };
    const addFields = {
      gstInData: {
        $filter: {
          input: "$gstInData",
          cond: {
            $and: [
              { $eq: ["$$this.allMatched", false] },
              {
                $or: [
                  { $eq: ["$$this.igstMatched", false] },
                  { $eq: ["$$this.cgstMatched", false] },
                  { $eq: ["$$this.sgstMatched", false] },
                  { $eq: ["$$this.invoiceNumberMatched", false] },
                  { $eq: ["$$this.gstInMatched", false] },
                  // { $eq: ["$$this.dateMatched", false] },
                ]
              }
            ]
          },
        },
      },
    };
    const project = {
      _id: 0,
      gstIn: 1,
    };
    const pipeline = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      //{ $sort: { "gstInData.templeteId": 1 } },
    ];
    const pipeline2 = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project },
      //{ $sort: { "gstInData.referenceTemplateId": 1 } },
    ];
    let templateOneData = await template1.aggregate(pipeline).toArray();
    let templateTwoData = await template2.aggregate(pipeline2).toArray();
    // return comapreData(templateOneData, templateTwoData)
    return [...templateOneData, ...templateTwoData];
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching fee payments." });
  }
};

const gstTempleteDataGstIn = async (batchObjectId, gstIn) => {
  try {
    const filter = {
      batchId: batchObjectId,
      gstIn: gstIn,
      isActive: true,
      probabilityExists: true,
      $and: [
        { "gstInData.allMatched": false },
        {
          "$and": [
            { "gstInData.igstMatched": true },
            { "gstInData.cgstMatched": true },
            { "gstInData.sgstMatched": true },
            { "gstInData.invoiceNumberMatched": false },
            { "gstInData.gstInMatched": true }
          ]
        }

      ]
    };
    const addFields = {
      gstInData: {
        $filter: {
          input: "$gstInData",
          cond: {
            $and: [
              { $eq: ["$$this.allMatched", false] },
              {
                $and: [
                  { $eq: ["$$this.igstMatched", true] },
                  { $eq: ["$$this.cgstMatched", true] },
                  { $eq: ["$$this.sgstMatched", true] },
                  { $eq: ["$$this.invoiceNumberMatched", false] },
                  { $eq: ["$$this.gstInMatched", true] }
                ]
              }
            ]
          },
        },
      },
    };
    const project = {
      _id: 0,
      gstInData: 1,
    };
    const pipeline = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project }
    ];
    const pipeline2 = [
      { $match: filter },
      { $addFields: addFields },
      { $project: project }
    ];
    let templateOneData = await template1.aggregate(pipeline).toArray();
    let templateTwoData = await template2.aggregate(pipeline2).toArray();
    // return comapreData(templateOneData, templateTwoData)
    return [...templateOneData, ...templateTwoData];
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching fee payments." });
  }
};


const probabilityExistsGstin = async (batchObjectId, gstIn, type) => {
  let update;
  const filter = {
    batchId: batchObjectId,
    gstIn: gstIn,
    isActive: true,
    probabilityExists: true,
  }
  if (type == "next") {
    update = {
      "$set": {
        submitted: true
      }
    }

  } else {
    update = {
      "$set": {
        probabilityExists: false
      }
    }
  }

  await template1.updateOne(filter, update);
  await template2.updateOne(filter, update);
}


const submitData = async (batchObjectId, gstInList) => {
  const filter = {
    batchId: batchObjectId,
    gstIn: {
      "$in": gstInList
    },
    isActive: true,

  }
  update = {
    "$set": {
      submitted: true,
    }
  }
  await template1.updateOne(filter, update);
  await template2.updateOne(filter, update);
}

const getMatchNumber = async (batchObjectId) => {
  let filter = {
    batchId: batchObjectId,
    isActive: true
  }
  project = {
    pm: 1,
    cm: 1,
    mm: 1,
    _id: 0
  }
  return await gstNumberData.findOne(filter, { projection: project });
}

const addBatchNumberMap = async (batchMatchData) => {
  const filter = {
    batchId: batchMatchData.batchId,
    isActive: true
  }
  update = {
    "$set": {
      isActive: false,
    }
  }
  await gstNumberData.updateOne(filter, update);
  await gstNumberData.insertOne(batchMatchData);
}



module.exports = {
  gstData,
  compareGstData,
  gstTempleteTwoData,
  gstDataSet,
  setOtherParameter,
  getMatchedDataAll,
  getNotMached,
  partialMatched,
  getTemplateData,
  gstTempleteTwoDataDate,
  gstTempleteData,
  setDataTwoTemplate,
  setDataTempOne,
  setDataTempTwo,
  matchData,
  getBatchId,
  checkExists,
  updateIsActiveFalse,
  getAllMisMatchedData,
  setProbabilityData,
  approveGstData,
  unMatchData,
  getMatchedDataAllManual,
  getMatchedDataAllProbable,
  getMatchedDataAllMatched,
  getGstin,
  gstTempleteDataGstIn,
  getAllMisMatchedDataNew,
  updateProbability,
  probabilityExistsGstin,
  submitData,
  addBatchNumberMap,
  getMatchNumber,
  updateNumbers
};
