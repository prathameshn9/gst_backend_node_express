const gstRepo = require("../repo/gst_data_repo");

const errors = require("../errors_helper");

const { groupBy, forEach, isUndefined } = require("lodash");

const natural = require("natural");

const helper = require("../helpers");

const Fuse = require("fuse.js");

const stringSimilarity = require("string-similarity");
const { response } = require("express");

const gstData = (
  data,
  type,
  res,
  batchObjectId,
  month,
  year,
  clientObjectId,
  groupObjectId,
) => {
  //insert batch number
  addNew(
    res,
    data,
    month,
    year,
    type,
    clientObjectId,
    groupObjectId,
    batchObjectId,
    100
  );
  ///check whether for months existed
};

// const addNew = (
//   res,
//   data,
//   month,
//   year,
//   type,
//   clientObjectId,
//   groupObjectId,
//   batchObjectId
// ) => {
//   let groupData = groupBy(data, "gstIn");
//   const keysList = Object.keys(groupData);
//   // ////console.log(keysList)
//   let insertData = [];
//   keysList.forEach((element) => {
//     insertData.push({
//       gstIn: element,
//       gstInData: groupData[element],
//       batchId: batchObjectId,
//       type: type,
//       isActive: true,
//       month: month,
//       year: year,
//       gstInDataLength: groupData[element].length,
//       clientId: clientObjectId,
//       groupId: groupObjectId,
//       isApproved: false,
//       probabilityMatched: false,
//       probabilityExists: true,
//       submitted: false
//     });
//   });
//   // ////console.log(insertData)
//   gstRepo
//     .gstData(insertData, type)
//     .then((data) => {
//       if (!data) {
//         return errors.errorHandler("Data Not Processed", res, 500);
//       }
     
//     })
//     .catch((error) => {
//       console.error("Error executing query:", error);
//     });
// };

const addNew = async (res, data, month, year, type, clientObjectId, groupObjectId, batchObjectId, batchSize) => {
  try {
    let groupData = groupBy(data, "gstIn");
    const keysList = Object.keys(groupData);
    const chunks = [];
    
    // Divide the keys into chunks for parallel processing
    for (let i = 0; i < keysList.length; i += batchSize) {
      chunks.push(keysList.slice(i, i + batchSize));
    }

    // Process each chunk in parallel
    await Promise.all(chunks.map(async (batchKeys) => {
      let insertData = [];

      batchKeys.forEach((element) => {
        insertData.push({
          gstIn: element,
          gstInData: groupData[element],
          batchId: batchObjectId,
          type: type,
          isActive: true,
          month: month,
          year: year,
          gstInDataLength: groupData[element].length,
          clientId: clientObjectId,
          groupId: groupObjectId,
          isApproved: false,
          probabilityMatched: false,
          probabilityExists: true,
          submitted: false
        });
      });
      // console.log(insertData);
      // console.log(insertData.length);
      // Perform bulk insertion
      const result = await gstRepo.gstData(insertData, type);

      if (!result) {
        throw new Error("Data Not Processed");
      }
    }));

    // Respond to the client or perform additional actions after batch insertion
   res.status(201).json({ batchId: batchObjectId.toString() , importedData: data.length});
  } catch (error) {
    console.error("Error executing batch insertion:", error);
    res.status(500).send("Error occurred during batch insertion");
  }
};

// const addNew = async (res, data, month, year, type, clientObjectId, groupObjectId, batchObjectId, batchSize) => {
//   try {
//     // Group the data by gstIn
//     let groupData = groupBy(data, "gstIn");
//     const keysList = Object.keys(groupData);

//     // Iterate over keys in batches
//     for (let i = 0; i < keysList.length; i += batchSize) {
//       const batchKeys = keysList.slice(i, i + batchSize);
//       let insertData = [];

//       // Build insertData for the current batch
//       batchKeys.forEach((element) => {
//         insertData.push({
//           gstIn: element,
//           gstInData: groupData[element],
//           batchId: batchObjectId,
//           type: type,
//           isActive: true,
//           month: month,
//           year: year,
//           gstInDataLength: groupData[element].length,
//           clientId: clientObjectId,
//           groupId: groupObjectId,
//           isApproved: false,
//           probabilityMatched: false,
//           probabilityExists: true,
//           submitted: false
//         });
//       });

//       // Perform batch insertion
//       const result = await gstRepo.gstData(insertData, type);

//       if (!result) {
//         return errors.errorHandler("Data Not Processed", res, 500);
//       }
//     }
//     // Respond to the client or perform additional actions after batch insertion
//     return errors.render({ batchId: batchObjectId.toString() }, res, 201);
//   } catch (error) {
//     console.error("Error executing batch insertion:", error);
//     res.status(500).send("Error occurred during batch insertion");
//   }
// };


const compareGstData = async (batchObjectId, res) => {
  try {
    const tolerance = 1;
    let commonMatched = 0
    //get data from db
    // Get data from the database
    const gstData = await gstRepo.gstTempleteData(batchObjectId);

    // Group data by type
    const groupedTemplatedData = groupBy(gstData, "type");
    const commaRegExp = /,/g;
  
    groupedTemplatedData["templateOne"].forEach(async (element) => {
      let tempTwoInvoiceData;
      let remainingData = [];
      let templateOneData = [];
      let templateTwoData = [];
      let gstTempTwoData = groupedTemplatedData["templateTwo"].find(
        (gstData) => gstData.gstIn == element.gstIn
      );
      if (gstTempTwoData) {
        //now gstIn data found in 2b register
        //now grouping gstin in purchase register grouped by invoice
        let tempOneInoviceData = groupBy(
          element.gstInData,
          "newInvoiceNumber"
        );
        //now grouping gstin in 2b register grouped by invoice
        tempTwoInvoiceData = groupBy(
          gstTempTwoData.gstInData,
          "newInvoiceNumber"
        );
        //now taking all invoive keys of gstin purchase and checking in 2b
        const TempOneInvoiceKeys = Object.keys(tempOneInoviceData);
        //now looping keys of purchase and checking in 2b
        TempOneInvoiceKeys.forEach((invoiceNumber) => {
          if (tempTwoInvoiceData[invoiceNumber]) {
            commonMatched += 1;
            //invoice number is present in 2b
            // check whether two gstin invoice have same length
            if (
              tempOneInoviceData[invoiceNumber].length ==
              tempTwoInvoiceData[invoiceNumber].length
            ) {
              for (
                let i = 0;
                i < tempOneInoviceData[invoiceNumber].length;
                i++
              ) {
                let element_1 = tempOneInoviceData[invoiceNumber][i];
                let matched = false;
                let templateOneInvoiceData;
                let templateTwoInvoiceData;

                for (
                  let j = 0;
                  j < tempTwoInvoiceData[invoiceNumber].length;
                  j++
                ) {
                  let element = tempTwoInvoiceData[invoiceNumber][j];

                  if (matched) {
                    break;
                  }
                  count = checkAllEqual(element_1, element, tolerance);
                  if (count.sgst && count.cgst && count.igst) {
                    templateOneInvoiceData = element_1; //template1 object
                    templateOneInvoiceData.sgstMatched = count.sgst;
                    templateOneInvoiceData.igstMatched = count.igst;
                    templateOneInvoiceData.cgstMatched = count.cgst;
                    templateOneInvoiceData.dateMatched = count.date;
                    templateOneInvoiceData.taxableValueMatched =
                      count.taxableValue;
                    templateOneInvoiceData.gstInMatched = true;
                    templateOneInvoiceData.invoiceNumberMatched = true;
                    templateOneInvoiceData.matched = true;
                   

                    templateTwoInvoiceData = element; // template 2 object
                    templateTwoInvoiceData.sgstMatched = count.sgst;
                    templateTwoInvoiceData.igstMatched = count.igst;
                    templateTwoInvoiceData.cgstMatched = count.cgst;
                    templateTwoInvoiceData.dateMatched = count.date;
                    templateTwoInvoiceData.taxableValueMatched =
                      count.taxableValue;
                    templateTwoInvoiceData.gstInMatched = true;
                    templateTwoInvoiceData.invoiceNumberMatched = true;
                    templateTwoInvoiceData.referenceTemplateId =
                      element_1.templeteId;
                    templateTwoInvoiceData.matched = true;
                    templateTwoInvoiceData.allMatched = true;
                    templateOneInvoiceData.allMatched = true;
                    templateTwoInvoiceData.typeMatch = "CM" + commonMatched
                    templateOneInvoiceData.typeMatch = "CM" + commonMatched
                    //removing matched doc
                    tempTwoInvoiceData[invoiceNumber].splice(j, 1);
                    // pushing to array
                    templateOneData.push(templateOneInvoiceData);
                    templateTwoData.push(templateTwoInvoiceData);
                    matched = true;

                    // if (count.count == 5) {
                    //   templateTwoInvoiceData.allMatched = true;
                    //   templateOneInvoiceData.allMatched = true;
                    //   templateTwoInvoiceData.typeMatch = "CM" + commonMatched
                    //   templateOneInvoiceData.typeMatch = "CM" + commonMatched
                    //   //removing matched doc
                    //   tempTwoInvoiceData[invoiceNumber].splice(j, 1);
                    //   // pushing to array
                    //   templateOneData.push(templateOneInvoiceData);
                    //   templateTwoData.push(templateTwoInvoiceData);
                    //   matched = true;
                    // }
                  } else {
                    templateOneInvoiceData = element_1; //template1 object
                    templateOneInvoiceData.sgstMatched = count.sgst;
                    templateOneInvoiceData.igstMatched = count.igst;
                    templateOneInvoiceData.cgstMatched = count.cgst;
                    templateOneInvoiceData.dateMatched = count.date;
                    templateOneInvoiceData.taxableValueMatched =
                      count.taxableValue;
                    templateOneInvoiceData.gstInMatched = true;
                    templateOneInvoiceData.invoiceNumberMatched = true;
                    templateOneInvoiceData.matched = true;
                    // templateOneInvoiceData.typeMatch = "CM" + commonMatched

                    templateTwoInvoiceData = element;
                    templateTwoInvoiceData.sgstMatched = count.sgst;
                    templateTwoInvoiceData.igstMatched = count.igst;
                    templateTwoInvoiceData.cgstMatched = count.cgst;
                    templateTwoInvoiceData.dateMatched = count.date;
                    templateTwoInvoiceData.taxableValueMatched =
                      count.taxableValue;
                    templateTwoInvoiceData.gstInMatched = true;
                    templateTwoInvoiceData.invoiceNumberMatched = true;
                    templateTwoInvoiceData.referenceTemplateId =
                      element_1.templeteId;
                    templateTwoInvoiceData.matched = true;
                    // templateTwoInvoiceData.typeMatch = "CM" + commonMatched
                  }
                }
                if (!matched) {
                  templateOneData.push(templateOneInvoiceData);
                }
              }
            } else if (
              tempOneInoviceData[invoiceNumber].length >
              tempTwoInvoiceData[invoiceNumber].length
            ) {
              checkOneGreaterOther(
                tempOneInoviceData,
                tempTwoInvoiceData,
                templateOneData,
                templateTwoData,
                tolerance,
                invoiceNumber,
                commaRegExp,
                commonMatched
              );
            } else if (
              tempOneInoviceData[invoiceNumber].length <
              tempTwoInvoiceData[invoiceNumber].length
            ) {
              checkOneGreaterOther(
                tempOneInoviceData,
                tempTwoInvoiceData,
                templateOneData,
                templateTwoData,
                tolerance,
                invoiceNumber, 
                commaRegExp,
                commonMatched
              );
            }
          } else {
            templateOneData.push(...tempOneInoviceData[invoiceNumber]);
          }
        });
      } else {
        // no gstin doc related to this in 2b
        templateOneData.push(...templateOneData);
      }
      for (const key in tempTwoInvoiceData) {
        remainingData.push(...tempTwoInvoiceData[key]);
      }
      templateTwoData = [...templateTwoData, ...remainingData];
      let newTemplateDataOne = templateOneData.filter(
        (element_2) => element_2 !== undefined
      );
      let newTemplateDataTwo = templateTwoData.filter(
        (element_3) => element_3 !== undefined
      );
      await Promise.all([
        (async () => {
          if (newTemplateDataOne.length > 0 && newTemplateDataTwo.length > 0) {
            templateOneLength = newTemplateDataOne.length;
            templateTwoLength = newTemplateDataTwo.length;
            await gstRepo.setDataTwoTemplate(
              element.gstIn,
              templateOneData,
              templateTwoData,
              batchObjectId,
              templateOneLength,
              templateTwoLength
            );
          } else if (templateOneData.length > 0) {
            await gstRepo.setDataTempOne(
              element.gstIn,
              templateOneData,
              batchObjectId,
              templateOneLength
            );
          }
        })(),
      ]);
     
     
    });
    return Promise.resolve();
  } catch (error) {
    // Handle any errors that occurred during execution
    console.error(error);
  }

  // return errors.render({}, res, 201);
};

function checkOneGreaterOther(
  tempOneInoviceData,
  tempTwoInvoiceData,
  templateOneData,
  templateTwoData,
  tolerance,
  invoiceNumber,
  regex,
  commonMatched
) {
  let templateOneInvoiceData;
  let templateTwoInvoiceData;

  const taxableValue = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumber],
    "taxableValue", regex
  );
  const igst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumber],
    "igst", regex
  );
  const cgst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumber],
    "cgst", regex
  );
  const sgst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumber],
    "sgst", regex
  );
  const taxableValue2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[invoiceNumber],
    "taxableValue", regex
  );
  const igst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[invoiceNumber],
    "igst", regex
  );
  const cgst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[invoiceNumber],
    "cgst", regex
  );
  const sgst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[invoiceNumber],
    "sgst", regex
  );
  let temp1 = {
    igst: igst,
    cgst: cgst,
    sgst: sgst,
    taxableValue: taxableValue,
  };
  let temp2 = {
    igst: igst2,
    cgst: cgst2,
    sgst: sgst2,
    taxableValue: taxableValue2,
  };
  count = {
    igst: false,
    cgst: false,
    sgst: false,
    taxableValue: false,
  };
  count = checkSgstAndIgstIsNumber(temp1, temp2, count);

  if (count.igst && count.cgst && count.sgst) {
    let templeteId = tempOneInoviceData[invoiceNumber][0]["templeteId"];
    let date = tempOneInoviceData[invoiceNumber][0]["newDate"];

    tempOneInoviceData[invoiceNumber].forEach((item) => {
      
      templateOneInvoiceData = item;
      templateOneInvoiceData.taxableValueMatched = count.taxableValue;
      templateOneInvoiceData.igstMatched = count.igst;
      templateOneInvoiceData.cgstMatched = count.cgst;
      templateOneInvoiceData.sgstMatched = count.sgst;
      templateOneInvoiceData.invoiceNumberMatched = true;
      templateOneInvoiceData.gstInMatched = true;
      templateOneInvoiceData.typeMatch = "CM" + commonMatched
      if (templateOneInvoiceData.newDate == date) {
        templateOneInvoiceData.dateMatched = true;
      }
      templateOneInvoiceData.dateMatched = true;
      templateOneInvoiceData.allMatched = true;
      templateOneInvoiceData.matched = true;
      templateOneInvoiceData.templeteId = templeteId;
      templateOneData.push(templateOneInvoiceData);
    });
    for (
      let index_1 = tempTwoInvoiceData[invoiceNumber].length - 1;
      index_1 >= 0;
      index_1--
    ) {
      const item_3 = tempTwoInvoiceData[invoiceNumber][index_1];
      templateTwoInvoiceData = item_3;
      templateTwoInvoiceData.taxableValueMatched = count.taxableValue;
      templateTwoInvoiceData.typeMatch = "CM" + commonMatched
      templateTwoInvoiceData.igstMatched = count.igst;
      templateTwoInvoiceData.cgstMatched = count.cgst;
      templateTwoInvoiceData.sgstMatched = count.sgst;
      templateTwoInvoiceData.invoiceNumberMatched = true;
      templateTwoInvoiceData.gstInMatched = true;
      if (templateTwoInvoiceData.newDate == date) {
        templateOneInvoiceData.dateMatched = true;
      }
      templateTwoInvoiceData.allMatched = true;
      templateTwoInvoiceData.matched = true;
      templateTwoInvoiceData.referenceTemplateId = templeteId;
      templateTwoData.push(templateTwoInvoiceData);

      // Use splice inside the for loop.
      tempTwoInvoiceData[invoiceNumber].splice(index_1, 1);
    }
  } else {
    //looping each data to make matched true
    tempOneInoviceData[invoiceNumber].forEach((element_1, index) => {
      let matched = false;
      let templateOneInvoiceData;
      let templateTwoInvoiceData;
      if (tempTwoInvoiceData[invoiceNumber].length > 0) {
        tempTwoInvoiceData[invoiceNumber].forEach((element, index) => {
          if (matched) {
            return;
          }
          count = checkAllEqual(element_1, element, tolerance);
          if (count.igst && count.cgst && count.sgst) {
            //check sgst igst and cgst not equal
            // count = checkSgstAndIgstIsNumber(element_1, element, count);

            templateOneInvoiceData = element_1; //template1 object
            templateOneInvoiceData.sgstMatched = count.sgst;
            templateOneInvoiceData.igstMatched = count.igst;
            templateOneInvoiceData.cgstMatched = count.cgst;
            templateOneInvoiceData.dateMatched = count.date;
            templateOneInvoiceData.typeMatch = "CM" + commonMatched
            templateOneInvoiceData.taxableValueMatched = count.taxableValue;
            templateOneInvoiceData.gstInMatched = true;
            templateOneInvoiceData.invoiceNumberMatched = true;
            templateOneInvoiceData.matched = true;

            templateTwoInvoiceData = element; // template 2 object
            templateTwoInvoiceData.sgstMatched = count.sgst;
            templateTwoInvoiceData.igstMatched = count.igst;
            templateTwoInvoiceData.cgstMatched = count.cgst;
            templateTwoInvoiceData.dateMatched = count.date;
            templateTwoInvoiceData.typeMatch = "CM" + commonMatched
            templateTwoInvoiceData.taxableValueMatched = count.taxableValue;
            templateTwoInvoiceData.gstInMatched = true;
            templateTwoInvoiceData.invoiceNumberMatched = true;
            templateTwoInvoiceData.referenceTemplateId = element_1.templeteId;
            templateTwoInvoiceData.matched = true;
            templateTwoInvoiceData.allMatched = true;
            templateOneInvoiceData.allMatched = true;
            // if (count.count == 5) {
            //   templateTwoInvoiceData.allMatched = true;
            //   templateOneInvoiceData.allMatched = true;
            // }
            // pushing to array
            templateOneData.push(templateOneInvoiceData);
            templateTwoData.push(templateTwoInvoiceData);
            //removing mached doc
            tempTwoInvoiceData[invoiceNumber].splice(index, 1);
            matched = true;
          } else {
            templateOneInvoiceData = element_1; //template1 object
            templateOneInvoiceData.sgstMatched = count.sgst;
            templateOneInvoiceData.igstMatched = count.igst;
            templateOneInvoiceData.cgstMatched = count.cgst;
            templateOneInvoiceData.dateMatched = count.date;
            templateOneInvoiceData.taxableValueMatched = count.taxableValue;
            templateOneInvoiceData.gstInMatched = true;
            templateOneInvoiceData.invoiceNumberMatched = true;
            templateOneInvoiceData.matched = true;
            // templateOneInvoiceData.typeMatch = "CM" + commonMatched

            templateTwoInvoiceData = element;
            templateTwoInvoiceData.sgstMatched = count.sgst;
            templateTwoInvoiceData.igstMatched = count.igst;
            templateTwoInvoiceData.cgstMatched = count.cgst;
            templateTwoInvoiceData.dateMatched = count.date;
            // templateTwoInvoiceData.typeMatch = "CM" + commonMatched
            templateTwoInvoiceData.taxableValueMatched = count.taxableValue;
            templateTwoInvoiceData.gstInMatched = true;
            templateTwoInvoiceData.invoiceNumberMatched = true;
            templateOneData.push(templateOneInvoiceData);
            templateTwoInvoiceData.matched = true;
            templateTwoInvoiceData.referenceTemplateId = element_1.templeteId;
            // templateOneData.push(element_1);
            matched = true;
          }
        });
      } else {
        templateOneData.push(element_1);
      }
    });
  }
}

function checkAllEqual(element_1, element, tolerance) {
  let taxableValue = false;
  let igst = false;
  let cgst = false;
  let sgst = false;
  let date = false;
  if (
    areNumbersMatching(element_1.igst, element.igst) ||
    areStringsMatching(element_1.igst, element.igst) ||
    areNumbersApproximatelyEqual(element_1.igst, element.igst, tolerance)
  ) {
    igst = true;
  }
  if (
    areNumbersMatching(element_1.cgst, element.cgst) ||
    areStringsMatching(element_1.cgst, element.cgst) ||
    areNumbersApproximatelyEqual(element_1.cgst, element.cgst, tolerance)
  ) {
    cgst = true;
  }
  if (
    areNumbersMatching(element_1.sgst, element.sgst) ||
    areStringsMatching(element_1.sgst, element.sgst) ||
    areNumbersApproximatelyEqual(element_1.sgst, element.sgst, tolerance)
  ) {
    sgst = true;
  }
  if (element_1.newDate == element.newDate) {
    date = true;
  }
  if (
    areNumbersMatching(element_1.taxableValue, element.taxableValue) ||
    areStringsMatching(element_1.taxableValue, element.taxableValue) ||
    areNumbersApproximatelyEqual(
      element_1.taxableValue,
      element.taxableValue,
      tolerance
    )
  ) {
    taxableValue = true;
  }
  let returnObject = {
    sgst: sgst,
    igst: igst,
    cgst: cgst,
    taxableValue: taxableValue,
    date: date,
    count: countTrue(taxableValue, igst, cgst, sgst, date),
  };
  return returnObject;
}

const compareGstDataNew = async (batchObjectId, res) => {
  try {
    await compareGstData(batchObjectId); // Wait for the comparison to finish

    // Send the response with status code 201 after the comparison is completed
    res.status(201).json({ message: "Data comparison completed successfully." });
  } catch (error) {
    // If there was an error during execution, send an error response
    res.status(500).json({ error: "An error occurred during data comparison." });
  }
};

function findSimilarStrings(array1, str2, maxLevenshteinDistance) {
  const result = [];
  for (const str1 of array1) {
    const levenshteinDistance = natural.LevenshteinDistance(str1, str2);
    if (levenshteinDistance <= maxLevenshteinDistance) {
      result.push(str1);
    }
  }
  return result;
}

function countTrue(...args) {
  return args.reduce(
    (count, currentValue) => count + (currentValue === true ? 1 : 0),
    0
  );
}

// Function to convert a formatted number string to a numerical value
function convertToNumber(str) {
  return parseFloat(str.replace(/,/g, ""));
}

// Function to compare two formatted numbers and return true if they match
function areNumbersMatching(str1, str2) {
  const num1 = convertToNumber(str1.trim());
  const num2 = convertToNumber(str2.trim());

  return num1 === num2;
}

function isSpecialCase(str) {
  // ////console.log(str)
  if (typeof str !== "string") {
    // Handle the case where str is not a string (e.g., return false or throw an error)
    return false;
  }
  const trimmedStr = str.trim();
  return (
    trimmedStr === "-" || // Match when the string is "-"
    trimmedStr === "0" || // Match when the string is "0"
    trimmedStr === "0.0" || // Match when the string is "0.0"
    trimmedStr.match(/^0\.0+$/) !== null || // Match when the string is "0.00" or "0.00000000000000" and so on
    trimmedStr === "" ||
    trimmedStr === " "
  );
}

function checkSgstAndIgstIsNumber(templateOne, templateTwo, count) {
  let tolerance = 1;
  if (
    templateOne.igst == templateTwo.igst ||
    areStringsMatching(templateOne.igst, templateTwo.igst) ||
    areNumbersApproximatelyEqual(templateOne.igst, templateTwo.igst, tolerance)
  ) {
    count.igst = true;
  }
  if (
    templateOne.cgst == templateTwo.cgst ||
    areStringsMatching(templateOne.cgst, templateTwo.cgst) ||
    areNumbersApproximatelyEqual(templateOne.cgst, templateTwo.cgst, tolerance)
  ) {
    count.cgst = true;
  }
  if (
    templateOne.sgst == templateTwo.sgst ||
    areStringsMatching(templateOne.sgst, templateTwo.sgst) ||
    areNumbersApproximatelyEqual(templateOne.sgst, templateTwo.sgst, tolerance)
  ) {
    count.sgst = true;
  }
  if (
    templateOne.taxableValue == templateTwo.taxableValue ||
    areStringsMatching(templateOne.taxableValue, templateTwo.taxableValue) ||
    areNumbersApproximatelyEqual(
      templateOne.taxableValue,
      templateTwo.taxableValue,
      tolerance
    )
  ) {
    count.taxableValue = true;
  }
  return count;
}


function areStringsMatching(s1, s2) {
  // If both strings are special cases, consider them a match
  if (isSpecialCase(s1) && isSpecialCase(s2)) {
    return true;
  }

  // Check if s1 and s2 are each other's special cases
  const s1IsSpecial = isSpecialCase(s1);
  const s2IsSpecial = isSpecialCase(s2);
  if ((s1IsSpecial && !s2IsSpecial) || (!s1IsSpecial && s2IsSpecial)) {
    return false;
  }

  // If none of the special cases are matched, compare the strings directly
  return s1 === s2;
}

function trimLeadingZeros(expression) {
  return expression.replace(/\b0+(\d+)/g, "$1");
}

function areExpressionsEqual(s1, s2) {
  const trimmedS1 = trimLeadingZeros(s1);
  const trimmedS2 = trimLeadingZeros(s2);

  return trimmedS1 === trimmedS2;
}

function areNumbersApproximatelyEqual(num1, num2, tolerance) {
  // Round both numbers to the same precision (e.g., 3 decimal places)
  const roundedNum1 = Number(parseFloat(num1).toFixed(3));
  const roundedNum2 = Number(parseFloat(num2).toFixed(3));

  // Calculate the absolute difference between the rounded numbers
  const diff = Math.abs(roundedNum1 - roundedNum2);
  // ////console.log(diff)
  // Compare the difference with the specified tolerance
  return diff <= tolerance;
}

const getMatchedDataAll = (batchObjectId, res) => {
  gstRepo
    .getMatchedDataAll(batchObjectId)
    .then((data) => {
      // ////console.log(data)
      let responseData = [];
      data.forEach((element) => {
        responseData.push(...element.gstInData);
      });
      if (responseData.length > 0) {
        let allMisMatched = groupBy(responseData, "type");
        return errors.render(
          {
            purchaseRegister: allMisMatched["templateOne"],
            twoBRegister: allMisMatched["templateTwo"],

          },
          res,
          200
        );
      }
      return errors.render(responseData, res, 200);
    })
    .catch((error) => {
      console.error("SomeThing Went Wrong Please Try Again Later ", error);
    });
};


const getMatchedDataAllMatched = (batchObjectId, res) => {
  gstRepo
    .getMatchedDataAllMatched(batchObjectId)
    .then((data) => {
      // ////console.log(data)
      let responseData = [];
      data.forEach((element) => {
        responseData.push(...element.gstInData);
      });
      if (responseData.length > 0) {
        let allMisMatched = groupBy(responseData, "type");
        return errors.render(
          {
            purchaseRegister: allMisMatched["templateOne"],
            twoBRegister: allMisMatched["templateTwo"],

          },
          res,
          200
        );
      }
      return errors.render(responseData, res, 200);
    })
    .catch((error) => {
      console.error("SomeThing Went Wrong Please Try Again Later ", error);
    });
};

const getMatchedDataAllProbable = (batchObjectId, res) => {
  gstRepo
    .getMatchedDataAllProbable(batchObjectId)
    .then((data) => {
      // ////console.log(data)
      let responseData = [];
      data.forEach((element) => {
        responseData.push(...element.gstInData);
      });
      if (responseData.length > 0) {
        let allMisMatched = groupBy(responseData, "type");
        return errors.render(
          {
            purchaseRegister: allMisMatched["templateOne"],
            twoBRegister: allMisMatched["templateTwo"],

          },
          res,
          200
        );
      }
      return errors.render(responseData, res, 200);
    })
    .catch((error) => {
      console.error("SomeThing Went Wrong Please Try Again Later ", error);
    });
};

const getMatchedDataAllManual = (batchObjectId, res) => {
  gstRepo
    .getMatchedDataAllManual(batchObjectId)
    .then((data) => {
      // ////console.log(data)
      let responseData = [];
      data.forEach((element) => {
        responseData.push(...element.gstInData);
      });
      if (responseData.length > 0) {
        let allMisMatched = groupBy(responseData, "type");
        return errors.render(
          {
            purchaseRegister: allMisMatched["templateOne"],
            twoBRegister: allMisMatched["templateTwo"],

          },
          res,
          200
        );
      }
      return errors.render(responseData, res, 200);
    })
    .catch((error) => {
      console.error("SomeThing Went Wrong Please Try Again Later ", error);
    });
};


const getNotMached = (batchObjectId, res) => {
  gstRepo
    .getNotMached(batchObjectId)
    .then((data) => {
      let responseData = [];
      let newResponseData = [];
      data.forEach((element) => {
        responseData.push(...element.gstInData);
      });
      let allMisMatched = groupBy(responseData, "gstIn");
      // ////console.log(allMisMatched)
      const uniqueArray = responseData.filter((item, index, arr) => {
        return index === arr.findIndex((obj) => obj.gstIn === item.gstIn);
      });
      // ////console.log(uniqueArray)
      uniqueArray.forEach((element) => {
        let newUpdatedData = [];
        let newData = [];
        let templateOne = groupBy(allMisMatched[element["gstIn"]], "type");
        let templateId = groupBy(templateOne["templateOne"], "templeteId");
        let referenceTemplateId = groupBy(
          templateOne["templateTwo"],
          "referenceTemplateId"
        );
        let keysList = [...new Set(Object.keys(templateId))];
        if (keysList.length > 0) {
          keysList.forEach((element1) => {
            // ////console.log(element1)
            if (referenceTemplateId[element1]) {
              newData.push(
                ...templateId[element1],
                ...referenceTemplateId[element1]
              );
              delete templateId[element1];
              delete referenceTemplateId[element1];
            } else {
              newData.push(...templateId[element1]);
              delete templateId[element1];
            }
          });
        }
        // ////console.log(newData)
        newUpdatedData = [
          ...newData,
          ...Object.values(referenceTemplateId).flat(),
        ];
        newResponseData.push({
          gstIn: element.gstIn,
          templateData: newUpdatedData,
        });
      });
      // // res.cacheControl('private', { maxAge: 3600});
      return errors.render(newResponseData, res, 200);
    })
    .catch((error) => {
      console.error("SomeThing Went Wrong Please Try Again Later ", error);
    });
};


const getManualMatched = (batchObjectId, res) => {
  gstRepo
    .getNotMached(batchObjectId)
    .then((data) => {
      let responseData = [];
      let newResponseData = [];
      data.forEach((element) => {
        responseData.push(...element.gstInData);
      });
      let allMisMatched = groupBy(responseData, "gstIn");
      // ////console.log(allMisMatched)
      const uniqueArray = responseData.filter((item, index, arr) => {
        return index === arr.findIndex((obj) => obj.gstIn === item.gstIn);
      });
      // ////console.log(uniqueArray)
      uniqueArray.forEach((element) => {
        let templateOne = groupBy(allMisMatched[element["gstIn"]], "type");
        newResponseData.push({
          gstIn: element.gstIn,
          purchaseRegister: templateOne["templateOne"],
          twoBRegister: templateOne["templateTwo"],
        });
      });
      // // res.cacheControl('private', { maxAge: 3600});
      return errors.render(newResponseData, res, 200);
    })
    .catch((error) => {
      console.error("SomeThing Went Wrong Please Try Again Later ", error);
    });
};

const partialMatched = (batchObjectId, res) => {
  gstRepo
    .partialMatched(batchObjectId)
    .then((data) => {
      let allMisMatched = groupBy(data, "gstIn");
      let responseData = [];
      const uniqueArray = data.filter((item, index, arr) => {
        return index === arr.findIndex((obj) => obj.gstIn === item.gstIn);
      });
      uniqueArray.forEach((element) => {
        let templateType = groupBy(allMisMatched[element["gstIn"]], "type");
        responseData.push({
          gstIn: element.gstIn,
          templateOne: templateType["templateOne"],
          templateTwo: templateType["templateTwo"],
        });
      });
      return errors.render(responseData, res, 200);
    })
    .catch((error) => {
      console.error("SomeThing Went Wrong Please Try Again Later ", error);
    });
};

const getTemplateData = (batchObjectId, res, type, page) => {
  gstRepo
    .getTemplateData(batchObjectId, type, 100000, 50)
    .then((data) => {
      // console.log(data);
      let responseData = [];
      data.forEach((element) => {
        responseData.push(element.gstInData);
      });
      // console.log(responseData.length)
      // res.cacheControl('private', { maxAge: 600});
      return errors.render(responseData, res, 200);
    })
    .catch((error) => {
      console.error("SomeThing Went Wrong Please Try Again Later ", error);
    });
};

const moveData = (batchObjectId, res, type, register, matchedUserId) => {
  if (type == "match") {
    // let purchaseRegisterEditId = []
    // let gstIN = groupBy(register, "gstIn");
    // let gstInList = Object.keys(gstIN);
    // update submit true
    // gstRepo.submitData(batchObjectId, gstInList)
    let templateType = groupBy(register, "type");
    let manualMatched = false;
    let templeteId = groupBy(templateType["templateOne"], "templeteId");
    // ////console.log(templateType)
    templateType["templateOne"].forEach((element) => {
      if ("manualMatched" in element && element.manualMatched) {
        manualMatched = true
      } else {
        manualMatched = false
      }
      //updateAllMatched ture
      gstRepo.matchData(
        element.gstIn,
        element.editId,
        "",
        element.invoiceNumber,
        "templateOne",
        batchObjectId,
        matchedUserId,
        manualMatched,
        element
      );
    });
    templateType["templateTwo"].forEach((element) => {
      if ("manualMatched" in element && element.manualMatched) {
        manualMatched = true
      } else {
        manualMatched = false
      }
      if (templeteId[helper.objectId(element["referenceTemplateId"])]) {
        let invoiceNumber =
          templeteId[helper.objectId(element["referenceTemplateId"])][0][
          "invoiceNumber"
          ];
        // ////console.log(invoiceNumber)
        gstRepo.matchData(
          element.gstIn,
          element.editId,
          element.referenceTemplateId,
          invoiceNumber,
          "templateTwo",
          batchObjectId,
          matchedUserId,
          manualMatched,
          element
        );
      }
    });
    errors.render({}, res, 200);
  } else {
    let templateType = groupBy(register, "type");
    templateType["templateOne"].forEach((element) => {
      //updateAllMatched ture
      gstRepo.unMatchData(
        element.gstIn,
        element.editId,
        element.invoiceNumber,
        "templateOne",
        batchObjectId,
        matchedUserId,
        element.templeteId
      );
    });
    templateType["templateTwo"].forEach((element) => {
      //updateAllMatched ture
      gstRepo.unMatchData(
        element.gstIn,
        element.editId,
        element.invoiceNumber,
        "templateTwo",
        batchObjectId,
        matchedUserId,
        element.templeteId
      );
    });
  }

  if (manualMatched) {
    gstRepo.updateNumbers(batchObjectId, "mm")
    
  } else {
    gstRepo.updateNumbers(batchObjectId, "mm")
  }
  errors.render({}, res, 200);
};

const getBatchId = (res, month, year, type, clientObjectId, groupObjectId) => {
  gstRepo
    .getBatchId(month, year, type, clientObjectId, groupObjectId)
    .then((data) => {
      // ////console.log(data)
      if (data) {
        errors.render(data, res, 200);
      } else {
        errors.render({}, res, 200);
      }
    });
};


const compareGstDataNewProbability = (batchObjectId, res) => {
  probabilityAdd(res, batchObjectId)
    .then(() => {
      // Send the response with status code 201 after the Promise is resolved
      return res
        .status(201)
        .json({ message: "Data comparison completed successfully." });
    })
    .catch((error) => {
      // If there was an error during execution, send an error response
      return res
        .status(500)
        .json({ error: "An error occurred during data comparison." });
    });
};


const probabilityAdd = async (res, batchObjectId) => {
  try {
    return await new Promise((resolve, reject) => {
      gstRepo.getAllMisMatchedData(batchObjectId).then((data) => {
        let groupedTemplatedData = groupBy(data, "type");
        const commaRegExp = /,/g;
        groupedTemplatedData["templateOne"].forEach((element) => {
          const tolerance = 1;
          let tempTwoInvoiceData;
          let remainingData = [];
          let templateOneData = [];
          let templateTwoData = [];
          let tempOneInoviceData;
          let TempTwoInvoiceKeys;
          let TempOneInvoiceKeys;
          let gstTempTwoData = groupedTemplatedData["templateTwo"].find(
            (gstData) => gstData.gstIn == element.gstIn
          );
          if (gstTempTwoData) {
            //now gstIn data found in 2b register
            //now grouping gstin in purchase register grouped by invoice
            tempOneInoviceData = groupBy(element.gstInData, "newInvoiceNumber");
            //now grouping gstin in 2b register grouped by invoice
            tempTwoInvoiceData = groupBy(
              gstTempTwoData.gstInData,
              "newInvoiceNumber"
            );
            //now taking all invoive keys of gstin purchase and checking in 2b
            TempOneInvoiceKeys = Object.keys(tempOneInoviceData);
            TempTwoInvoiceKeys = Object.keys(tempTwoInvoiceData);
           
            //now check for more close match
            for (let index = 0; index < TempOneInvoiceKeys.length; index++) {
              let templateOneInvoiceNumber = TempOneInvoiceKeys[index];
              //check any high probability exists for this
              let probableInvoice = highClosetMatchFuse(templateOneInvoiceNumber, TempTwoInvoiceKeys)
              //probable 2b invoice number
              if (probableInvoice != undefined && probableInvoice.length > 0) {
                for (let index = 0; index < probableInvoice.length; index++) {
                  const templateTwoInvoiceNumber = probableInvoice[index];
                  if (tempOneInoviceData[templateOneInvoiceNumber].length == tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
                    eqaulMatchProbability(tempOneInoviceData, tempTwoInvoiceData, templateOneInvoiceNumber, templateTwoInvoiceNumber, templateOneData, templateTwoData, TempTwoInvoiceKeys, TempOneInvoiceKeys, commaRegExp)
                  } else if (tempOneInoviceData[templateOneInvoiceNumber].length > tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
                    checkOneGreaterOtherProablilty(tempOneInoviceData, tempTwoInvoiceData, templateOneData, templateTwoData, tolerance, templateOneInvoiceNumber, templateTwoInvoiceNumber, TempTwoInvoiceKeys, TempOneInvoiceKeys, commaRegExp)
                  } else if (tempOneInoviceData[templateOneInvoiceNumber].length < tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
                    checkOneGreaterOtherProablilty(tempOneInoviceData, tempTwoInvoiceData, templateOneData, templateTwoData, tolerance, templateOneInvoiceNumber, templateTwoInvoiceNumber, TempTwoInvoiceKeys, TempOneInvoiceKeys, commaRegExp)
                  }
                }
              } else {
                templateOneData.push(tempOneInoviceData[templateOneInvoiceNumber]);
              }
            }
            for (let index = 0; index < TempOneInvoiceKeys.length; index++) {
              let templateOneInvoiceNumber = TempOneInvoiceKeys[index];
              //check any high probability exists for this
              let probableInvoice = highClosetMatch(templateOneInvoiceNumber, TempTwoInvoiceKeys)
              //probable 2b invoice number
              if (probableInvoice != undefined && probableInvoice.length > 0) {
                for (let index = 0; index < probableInvoice.length; index++) {
                  const templateTwoInvoiceNumber = probableInvoice[index];
                  if (tempOneInoviceData[templateOneInvoiceNumber].length == tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
                    eqaulMatchProbability(tempOneInoviceData, tempTwoInvoiceData, templateOneInvoiceNumber, templateTwoInvoiceNumber, templateOneData, templateTwoData, TempTwoInvoiceKeys, TempOneInvoiceKeys)
                  } else if (tempOneInoviceData[templateOneInvoiceNumber].length > tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
                    checkOneGreaterOtherProablilty(tempOneInoviceData, tempTwoInvoiceData, templateOneData, templateTwoData, tolerance, templateOneInvoiceNumber, templateTwoInvoiceNumber, TempTwoInvoiceKeys, TempOneInvoiceKeys)
                  } else if (tempOneInoviceData[templateOneInvoiceNumber].length < tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
                    checkOneGreaterOtherProablilty(tempOneInoviceData, tempTwoInvoiceData, templateOneData, templateTwoData, tolerance, templateOneInvoiceNumber, templateTwoInvoiceNumber, TempTwoInvoiceKeys, TempOneInvoiceKeys)
                  }
                }
              } else {
                templateOneData.push(tempOneInoviceData[templateOneInvoiceNumber]);
              }
            }
          } else {
            templateOneData.push(element);
          }
          for (const key in tempTwoInvoiceData) {
            remainingData.push(...tempTwoInvoiceData[key]);
          }
          // now group remaing invoice data with invoice number

          templateTwoData = [...templateTwoData, ...remainingData];
          let newTemplateDataOne = templateOneData.filter(
            (element_2) =>
              element_2 !== undefined &&
              element_2.length !== 0
          );
          let newTemplateDataTwo = templateTwoData.filter(
            (element_3) =>
              element_3 !== undefined &&
              element_3.length !== 0
          );
          if (newTemplateDataOne.length > 0) {
            newTemplateDataOne.forEach((element) => {
              gstRepo.setProbabilityData(batchObjectId, element, "templateOne");
            });
          }
          if (newTemplateDataTwo.length > 0) {
            newTemplateDataTwo.forEach((element) => {
              gstRepo.setProbabilityData(batchObjectId, element, "templateTwo");
            });
          }
        });
        resolve();
      });
    });
  } catch (error) {
    ////console.log(error);
  }
};

function eqaulMatchProbability(tempOneInoviceData, tempTwoInvoiceData, invoiceNumberOne, TwobInvoiceNumber, templateOneData, templateTwoData, TempTwoInvoiceKeys, TempOneInvoiceKeys, regex) {
  const taxableValue = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumberOne],
    "taxableValue", regex
  );
  const igst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumberOne],
    "igst", regex
  );
  const cgst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumberOne],
    "cgst", regex
  );
  const sgst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumberOne],
    "sgst", regex
  );

  const taxableValue2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "taxableValue", regex
  );
  const igst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "igst", regex
  );
  const cgst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "cgst", regex
  );
  const sgst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "sgst", regex
  );
  let temp1 = {
    igst: igst,
    cgst: cgst,
    sgst: sgst,
    taxableValue: taxableValue,
  };
  let temp2 = {
    igst: igst2,
    cgst: cgst2,
    sgst: sgst2,
    taxableValue: taxableValue2,
  };
  count = {
    igst: false,
    cgst: false,
    sgst: false,
    taxableValue: false,
  };
  count = checkSgstAndIgstIsNumber(temp1, temp2, count);
  if (count.igst && count.cgst && count.sgst) {
    let indexToRemove = TempTwoInvoiceKeys.indexOf(TwobInvoiceNumber)
    if (indexToRemove !== -1) {
      TempTwoInvoiceKeys.splice(indexToRemove, 1);
    }
    indexToRemove = TempOneInvoiceKeys.indexOf(invoiceNumberOne)
    if (indexToRemove !== -1) {
      TempOneInvoiceKeys.splice(indexToRemove, 1);
    }
    let templeteId = tempOneInoviceData[invoiceNumberOne][0]["templeteId"];
    let date = tempOneInoviceData[invoiceNumberOne][0]["newDate"];
    tempOneInoviceData[invoiceNumberOne].forEach((item) => {
      let templateOneInvoiceData = item;
      templateOneInvoiceData.taxableValueMatched = count.taxableValue;
      templateOneInvoiceData.igstMatched = count.igst;
      templateOneInvoiceData.cgstMatched = count.cgst;
      templateOneInvoiceData.sgstMatched = count.sgst;
      // templateOneInvoiceData.invoiceNumberMatched = true;
      templateOneInvoiceData.gstInMatched = true;
      if (templateOneInvoiceData.newDate == date) {
        templateOneInvoiceData.dateMatched = true;
      }
      // templateOneInvoiceData.allMatched = true;
      templateOneInvoiceData.matched = true;
      templateOneInvoiceData.templeteId = templeteId;
      templateOneInvoiceData.comapareRemark = `invoiceNumber is ${invoiceNumberOne} matched with ${TwobInvoiceNumber}`;
      templateOneData.push(templateOneInvoiceData);
    });
    for (
      let index_1 = tempTwoInvoiceData[TwobInvoiceNumber].length - 1;
      index_1 >= 0;
      index_1--
    ) {
      const item_3 = tempTwoInvoiceData[TwobInvoiceNumber][index_1];
      let templateTwoInvoiceData = item_3;
      templateTwoInvoiceData.taxableValueMatched = count.taxableValue;
      templateTwoInvoiceData.igstMatched = count.igst;
      templateTwoInvoiceData.cgstMatched = count.cgst;
      templateTwoInvoiceData.sgstMatched = count.sgst;
      templateTwoInvoiceData.gstInMatched = true;
      if (templateTwoInvoiceData.newDate == date) {
        templateTwoInvoiceData.dateMatched = true;
      }
      templateTwoInvoiceData.matched = true;
      templateTwoInvoiceData.referenceTemplateId = templeteId;
      tempOneInoviceData.comapareRemark = `invoiceNumber is ${invoiceNumberOne} matched with ${TwobInvoiceNumber}`;
      templateTwoData.push(templateTwoInvoiceData);
      // Use splice inside the for loop.
      tempTwoInvoiceData[TwobInvoiceNumber].splice(index_1, 1);
    }
  }
}

function checkOneGreaterOtherProablilty(
  tempOneInoviceData,
  tempTwoInvoiceData,
  templateOneData,
  templateTwoData,
  tolerance,
  invoiceNumber,
  TwobInvoiceNumber,
  TempTwoInvoiceKeys,
  TempOneInvoiceKeys,
  commaRegExp
) {
  let templateOneInvoiceData;
  let templateTwoInvoiceData;
  
  const taxableValue = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumber],
    "taxableValue", commaRegExp
  );
  const igst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumber],
    "igst", commaRegExp
  );
  const cgst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumber],
    "cgst", commaRegExp
  );
  const sgst = calculateSumWithNaNHandling(
    tempOneInoviceData[invoiceNumber],
    "sgst", commaRegExp
  );
  // ////console.log(tempTwoInvoiceData, "invoiceNUmber", TwobInvoiceNumber )
  calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "taxableValue", commaRegExp
  );
  const taxableValue2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "taxableValue", commaRegExp
  );
  const igst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "igst", commaRegExp
  );
  const cgst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "cgst", commaRegExp
  );
  const sgst2 = calculateSumWithNaNHandling(
    tempTwoInvoiceData[TwobInvoiceNumber],
    "sgst", commaRegExp
  );
  let temp1 = {
    igst: igst,
    cgst: cgst,
    sgst: sgst,
    taxableValue: taxableValue,
  };
  let temp2 = {
    igst: igst2,
    cgst: cgst2,
    sgst: sgst2,
    taxableValue: taxableValue2,
  };
  count = {
    igst: false,
    cgst: false,
    sgst: false,
    taxableValue: false,
  };
  count = checkSgstAndIgstIsNumber(temp1, temp2, count);
  if (count.cgst && count.sgst && count.igst) {
    let indexToRemove = TempTwoInvoiceKeys.indexOf(TwobInvoiceNumber)
    if (indexToRemove !== -1) {
      TempTwoInvoiceKeys.splice(indexToRemove, 1);
    }
    indexToRemove = TempOneInvoiceKeys.indexOf(invoiceNumber)
    if (indexToRemove !== -1) {
      TempOneInvoiceKeys.splice(indexToRemove, 1);
    }
    let templeteId = tempOneInoviceData[invoiceNumber][0]["templeteId"];
    let date = tempOneInoviceData[invoiceNumber][0]["newDate"];
    tempOneInoviceData[invoiceNumber].forEach((item) => {
      templateOneInvoiceData = item;
      templateOneInvoiceData.taxableValueMatched = count.taxableValue;
      templateOneInvoiceData.igstMatched = count.igst;
      templateOneInvoiceData.cgstMatched = count.cgst;
      templateOneInvoiceData.sgstMatched = count.sgst;
      // templateOneInvoiceData.invoiceNumberMatched = true;
      templateOneInvoiceData.gstInMatched = true;
      if (templateOneInvoiceData.newDate == date) {
        templateOneInvoiceData.dateMatched = true;
      }

      // templateOneInvoiceData.allMatched = true;
      templateOneInvoiceData.matched = true;
      templateOneInvoiceData.templeteId = templeteId;
      templateOneInvoiceData.comapareRemark = `invoiceNumber is ${invoiceNumber} matched with ${TwobInvoiceNumber}`;
      // dateMatchArray.push(templateOneInvoiceData)
      templateOneData.push(templateOneInvoiceData);
    });
    for (
      let index_1 = tempTwoInvoiceData[TwobInvoiceNumber].length - 1;
      index_1 >= 0;
      index_1--
    ) {
      const item_3 = tempTwoInvoiceData[TwobInvoiceNumber][index_1];
      templateTwoInvoiceData = item_3;
      templateTwoInvoiceData.taxableValueMatched = true;
      templateTwoInvoiceData.igstMatched = count.igst;
      templateTwoInvoiceData.cgstMatched = count.cgst;
      templateTwoInvoiceData.sgstMatched = count.sgst;
      // templateTwoInvoiceData.invoiceNumberMatched = true;
      templateTwoInvoiceData.gstInMatched = true;
      if (templateTwoInvoiceData.newDate == date) {
        templateOneInvoiceData.dateMatched = true;
      }

      // templateTwoInvoiceData.dateMatched = true;
      // templateTwoInvoiceData.allMatched = true;
      templateTwoInvoiceData.matched = true;
      templateTwoInvoiceData.referenceTemplateId = templeteId;
      templateOneInvoiceData.comapareRemark = `invoiceNumber is ${invoiceNumber} matched with ${TwobInvoiceNumber}`;
      templateTwoData.push(templateTwoInvoiceData);
      // dateMatchArrayTwoB.push(templateTwoInvoiceData)
      // Use splice inside the for loop.
      tempTwoInvoiceData[TwobInvoiceNumber].splice(index_1, 1);
    }
  } else {
    //looping each data to make matched true
    tempOneInoviceData[invoiceNumber].forEach((element_1, index) => {
      let matched = false;
      let templateOneInvoiceData;
      let templateTwoInvoiceData;
      if (tempTwoInvoiceData[TwobInvoiceNumber].length > 0) {
        tempTwoInvoiceData[TwobInvoiceNumber].forEach((element, index) => {
          if (matched) {
            return;
          }
          count = checkAllEqual(element_1, element, tolerance);
          if (count.igst && count.cgst && count.sgst) {
            let indexToRemove = TempTwoInvoiceKeys.indexOf(TwobInvoiceNumber)
            if (indexToRemove !== -1) {
              TempTwoInvoiceKeys.splice(indexToRemove, 1);
            }
            indexToRemove = TempOneInvoiceKeys.indexOf(invoiceNumber)
            if (indexToRemove !== -1) {
              TempOneInvoiceKeys.splice(indexToRemove, 1);
            }
            templateOneInvoiceData = element_1; //template1 object
            templateOneInvoiceData.sgstMatched = count.sgst;
            templateOneInvoiceData.igstMatched = count.igst;
            templateOneInvoiceData.cgstMatched = count.cgst;
            templateOneInvoiceData.dateMatched = count.date;
            templateOneInvoiceData.taxableValueMatched = count.taxableValue;
            templateOneInvoiceData.gstInMatched = true;
            templateOneInvoiceData.comapareRemark = `invoiceNumber is ${invoiceNumber} matched with ${TwobInvoiceNumber}`;
            // templateOneInvoiceData.invoiceNumberMatched = true;
            templateOneInvoiceData.matched = true;

            templateTwoInvoiceData = element; // template 2 object
            templateTwoInvoiceData.sgstMatched = count.sgst;
            templateTwoInvoiceData.igstMatched = count.igst;
            templateTwoInvoiceData.cgstMatched = count.cgst;
            templateTwoInvoiceData.dateMatched = count.date;
            templateTwoInvoiceData.taxableValueMatched = count.taxableValue;
            templateTwoInvoiceData.gstInMatched = true;
            templateTwoInvoiceData.comapareRemark = `invoiceNumber is ${invoiceNumber} matched with ${TwobInvoiceNumber}`;
            // templateTwoInvoiceData.invoiceNumberMatched = true;
            templateTwoInvoiceData.referenceTemplateId = element_1.templeteId;
            templateTwoInvoiceData.matched = true;
            // if (count == 5 || (count.sgst && count.cgst) || count.igst) {
            //   templateTwoInvoiceData.allMatched = true;
            //   templateOneInvoiceData.allMatched = true;
            // }
            // pushing to array
            templateOneData.push(templateOneInvoiceData);
            templateTwoData.push(templateTwoInvoiceData);
            //removing mached doc
            tempTwoInvoiceData[TwobInvoiceNumber].splice(index, 1);
            matched = true;
          } else {
            templateOneInvoiceData = element_1; //template1 object
            templateOneInvoiceData.sgstMatched = count.sgst;
            templateOneInvoiceData.igstMatched = count.igst;
            templateOneInvoiceData.cgstMatched = count.cgst;
            templateOneInvoiceData.dateMatched = count.date;
            templateOneInvoiceData.taxableValueMatched = count.taxableValue;
            templateOneInvoiceData.gstInMatched = true;
            // templateOneInvoiceData.invoiceNumberMatched = true;
            templateOneInvoiceData.matched = true;
            if (count.igst && count.cgst && count.sgst) {
              const indexToRemove = TempTwoInvoiceKeys.indexOf(TwobInvoiceNumber)
              if (indexToRemove !== -1) {
                TempTwoInvoiceKeys.splice(indexToRemove, 1);
              }
              indexToRemove = TempOneInvoiceKeys.indexOf(invoiceNumber)
              if (indexToRemove !== -1) {
                TempOneInvoiceKeys.splice(indexToRemove, 1);
              }
              templateOneInvoiceData.comapareRemark = `invoiceNumber is ${invoiceNumber} matched with ${TwobInvoiceNumber}`;
            }

            templateTwoInvoiceData = element;
            templateTwoInvoiceData.sgstMatched = count.sgst;
            templateTwoInvoiceData.igstMatched = count.igst;
            templateTwoInvoiceData.cgstMatched = count.cgst;
            templateTwoInvoiceData.dateMatched = count.date;
            templateTwoInvoiceData.taxableValueMatched = count.taxableValue;
            templateTwoInvoiceData.gstInMatched = true;
            if (count.igst && count.cgst && count.sgst) {
              const indexToRemove = TempTwoInvoiceKeys.indexOf(TwobInvoiceNumber)
              if (indexToRemove !== -1) {
                TempTwoInvoiceKeys.splice(indexToRemove, 1);
              }
              indexToRemove = TempOneInvoiceKeys.indexOf(invoiceNumber)
              if (indexToRemove !== -1) {
                TempOneInvoiceKeys.splice(indexToRemove, 1);
              }
              templateTwoInvoiceData.comapareRemark = `invoiceNumber is ${invoiceNumber} matched with ${TwobInvoiceNumber}`;
            }
            // templateTwoInvoiceData.invoiceNumberMatched = true;
            templateOneData.push(templateOneInvoiceData);
            templateTwoInvoiceData.matched = true;
            templateTwoInvoiceData.referenceTemplateId = element_1.templeteId;
            // templateOneData.push(element_1);
            matched = true;
          }
        });
      } else {
        templateOneData.push(element_1);
      }
    });
  }
}




function highClosetMatch(pattern, TempTwoInvoiceKey) {
  let probable = []
  if (TempTwoInvoiceKey.length > 0) {
    const similarity = stringSimilarity.findBestMatch(pattern, TempTwoInvoiceKey);
    if (similarity.bestMatch.rating >= 0.68) {
      probable.push(similarity.bestMatch.target);
      return probable;
    }
  }
}


function highClosetMatchFuse(pattern, TempTwoInvoiceKey) {
  const options = {
    includeScore: true,
    threshold: 0.70  // Adjust the threshold as needed
  };
  let probable = []
  const fuse = new Fuse(TempTwoInvoiceKey, options);
  if (TempTwoInvoiceKey.length > 0) {
    const results = fuse.search(pattern);
    if (results.length > 0) {
      probable.push(results[0].item);
      return probable;
    }
  }
}


const getGstin= (batchObjectId, res, groupObjectId) => {
  let gstInList = []
  gstRepo
  .getGstin(batchObjectId, groupObjectId)
  .then((data) => {
    if (data) {
      data.forEach(element => {
        gstInList.push(element.gstIn)
      });
      // Create a Set to store unique values
      const uniqueSet = new Set(gstInList);
      // Convert the Set back to an array
      const uniqueArray = Array.from(uniqueSet);
      errors.render(uniqueArray, res, 200);
    } else {
      errors.render({}, res, 200);
    }
  });
}



























const approveGstData = async (batchObjectId, res, matchedUserId, type) => {
  await gstRepo.approveGstData(batchObjectId, matchedUserId, type)
}

function calculateSumWithNaNHandling(data, property, regex) {
  return data.reduce((acc, item) => {
    const parsedValue = parseFloat(item[property].replace(regex, ""));

    if (!isNaN(parsedValue)) {
      return acc + parsedValue;
    } else {
      return acc; // Add zero to the accumulator for NaN values
    }
  }, 0);
}







// const probabilityAddNewGstin = async (res, batchObjectId, gstIn) => {
//   try {
//     return await new Promise((resolve, reject) => {
//       gstRepo.getAllMisMatchedDataNew(batchObjectId, gstIn).then((data) => {
//         gstRepo.updateProbability(batchObjectId, gstIn)
//         let groupedTemplatedData = groupBy(data, "type");
//         // ////console.log(groupedTemplatedData)
//         const commaRegExp = /,/g;
//         if (groupedTemplatedData["templateOne"] && groupedTemplatedData["templateTwo"]) {
//           groupedTemplatedData["templateOne"].forEach((element) => {
//             const tolerance = 1;
//             let tempTwoInvoiceData;
//             let remainingData = [];
//             let templateOneData = [];
//             let templateTwoData = [];
//             let tempOneInoviceData;
//             let TempTwoInvoiceKeys;
//             let TempOneInvoiceKeys;
//             // if (groupedTemplatedData["templateTwo"]) {
              
//             // }
//             let gstTempTwoData = groupedTemplatedData["templateTwo"].find(
//               (gstData) => gstData.gstIn == element.gstIn
//             );
//             if (gstTempTwoData) {
//               //now gstIn data found in 2b register
//               //now grouping gstin in purchase register grouped by invoice
//               tempOneInoviceData = groupBy(element.gstInData, "newInvoiceNumber");
//               //now grouping gstin in 2b register grouped by invoice
//               tempTwoInvoiceData = groupBy(
//                 gstTempTwoData.gstInData,
//                 "newInvoiceNumber"
//               );
//               //now taking all invoive keys of gstin purchase and checking in 2b
//               TempOneInvoiceKeys = Object.keys(tempOneInoviceData);
//               TempTwoInvoiceKeys = Object.keys(tempTwoInvoiceData);
             
//               //now check for more close match
//               for (let index = 0; index < TempOneInvoiceKeys.length; index++) {
//                 let templateOneInvoiceNumber = TempOneInvoiceKeys[index];
//                 //check any high probability exists for this
//                 let probableInvoice = highClosetMatchFuse(templateOneInvoiceNumber, TempTwoInvoiceKeys)
//                 //probable 2b invoice number
//                 if (probableInvoice != undefined && probableInvoice.length > 0) {
//                   for (let index = 0; index < probableInvoice.length; index++) {
//                     const templateTwoInvoiceNumber = probableInvoice[index];
//                     if (tempOneInoviceData[templateOneInvoiceNumber].length == tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
//                       eqaulMatchProbability(tempOneInoviceData, tempTwoInvoiceData, templateOneInvoiceNumber, templateTwoInvoiceNumber, templateOneData, templateTwoData, TempTwoInvoiceKeys, TempOneInvoiceKeys, commaRegExp)
//                     } else if (tempOneInoviceData[templateOneInvoiceNumber].length > tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
//                       checkOneGreaterOtherProablilty(tempOneInoviceData, tempTwoInvoiceData, templateOneData, templateTwoData, tolerance, templateOneInvoiceNumber, templateTwoInvoiceNumber, TempTwoInvoiceKeys, TempOneInvoiceKeys, commaRegExp)
//                     } else if (tempOneInoviceData[templateOneInvoiceNumber].length < tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
//                       checkOneGreaterOtherProablilty(tempOneInoviceData, tempTwoInvoiceData, templateOneData, templateTwoData, tolerance, templateOneInvoiceNumber, templateTwoInvoiceNumber, TempTwoInvoiceKeys, TempOneInvoiceKeys, commaRegExp)
//                     }else{
                      
//                     }
//                   }
//                 } else {
//                   templateOneData.push(tempOneInoviceData[templateOneInvoiceNumber]);
//                 }
//               }
//               for (let index = 0; index < TempOneInvoiceKeys.length; index++) {
//                 let templateOneInvoiceNumber = TempOneInvoiceKeys[index];
//                 //check any high probability exists for this
//                 let probableInvoice = highClosetMatch(templateOneInvoiceNumber, TempTwoInvoiceKeys)
//                 //probable 2b invoice number
//                 if (probableInvoice != undefined && probableInvoice.length > 0) {
//                   for (let index = 0; index < probableInvoice.length; index++) {
//                     const templateTwoInvoiceNumber = probableInvoice[index];
//                     if (tempOneInoviceData[templateOneInvoiceNumber].length == tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
//                       eqaulMatchProbability(tempOneInoviceData, tempTwoInvoiceData, templateOneInvoiceNumber, templateTwoInvoiceNumber, templateOneData, templateTwoData, TempTwoInvoiceKeys, TempOneInvoiceKeys)
//                     } else if (tempOneInoviceData[templateOneInvoiceNumber].length > tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
//                       checkOneGreaterOtherProablilty(tempOneInoviceData, tempTwoInvoiceData, templateOneData, templateTwoData, tolerance, templateOneInvoiceNumber, templateTwoInvoiceNumber, TempTwoInvoiceKeys, TempOneInvoiceKeys)
//                     } else if (tempOneInoviceData[templateOneInvoiceNumber].length < tempTwoInvoiceData[templateTwoInvoiceNumber].length) {
//                       checkOneGreaterOtherProablilty(tempOneInoviceData, tempTwoInvoiceData, templateOneData, templateTwoData, tolerance, templateOneInvoiceNumber, templateTwoInvoiceNumber, TempTwoInvoiceKeys, TempOneInvoiceKeys)
//                     }
//                   }
//                 } else {
//                   templateOneData.push(tempOneInoviceData[templateOneInvoiceNumber]);
//                 }
//               }
//             } else {
//               templateOneData.push(element);
//             }
//             for (const key in tempTwoInvoiceData) {
//               remainingData.push(...tempTwoInvoiceData[key]);
//             }
//             // now group remaing invoice data with invoice number
  
//             templateTwoData = [...templateTwoData, ...remainingData];
//             let newTemplateDataOne = templateOneData.filter(
//               (element_2) =>
//                 element_2 !== undefined &&
//                 element_2 !== {} &&
//                 element_2.length !== 0
//             );
//             let newTemplateDataTwo = templateTwoData.filter(
//               (element_3) =>
//                 element_3 !== undefined &&
//                 element_3 !== {} &&
//                 element_3.length !== 0
//             );
//             let sortResponseData = []
//             if (newTemplateDataOne.length > 0 && newTemplateDataTwo.length > 0) {
//               let newData =  [...newTemplateDataOne,...newTemplateDataTwo]
//               let totalMap = groupBy(newData, "totalSumAmount");
//               let keys = Object.keys(totalMap);
//               keys.forEach(element => {
//                 //geting all element of list
//                 let newTotal = totalMap[element]
//                 let groupTemplateList = groupBy(newTotal, "type")
//                 if (groupTemplateList["templateOne"] && groupTemplateList["templateTwo"]) {
//                   groupTemplateList["templateOne"].forEach(element1 => {
//                     element1.sgstMatched = true
//                     element1.cgstMatched = true
//                     element1.igstMatched = true
//                     element1.gstInMatched = true
//                   })
//                   groupTemplateList["templateTwo"].forEach(element1 => {
//                     element1.sgstMatched = true
//                     element1.cgstMatched = true
//                     element1.igstMatched = true
//                     element1.gstInMatched = true
//                   })
//                   sortResponseData.push(...groupTemplateList["templateOne"])
//                   sortResponseData.push(...groupTemplateList["templateTwo"])
//                 }
//                 else{
//                   sortResponseData.push(...totalMap[element])
//                 }
//               });
//               let newDate = groupBy(newData, "newDate");
//               let dateKeys = Object.keys(newDate);
//               keys.forEach(element => {
//                 //geting all element of list
//                 let date = dateKeys[element]
//                 let groupTemplateList = groupBy(date, "type")
//                 if (groupTemplateList["templateOne"] && groupTemplateList["templateTwo"]) {
//                   groupTemplateList["templateOne"].forEach(element1 => {
//                     element1.dateMatched = true
//                   })
//                   groupTemplateList["templateTwo"].forEach(element1 => {
//                     element1.dateMatched = true
//                   })
//                   sortResponseData.push(...groupTemplateList["templateOne"])
//                   sortResponseData.push(...groupTemplateList["templateTwo"])
//                 }
//                 else{
//                   sortResponseData.push(...totalMap[element])
//                 }
//               });
//             }
//             let newDataGroup = groupBy(sortResponseData, "type")
//             if (newDataGroup["templateOne"]) {
//               newDataGroup["templateOne"].forEach((element) => {
//                 gstRepo.setProbabilityData(batchObjectId, element, "templateOne");
//               });
//             }
//             if (newDataGroup["templateTwo"]) {
//               newDataGroup["templateTwo"].forEach((element) => {
//                 gstRepo.setProbabilityData(batchObjectId, element, "templateTwo");
//               });
//             }
//           });
//         }
       
//         resolve();
//       });
//     });
//   } catch (error) {
//     ////console.log(error);
//   }
// };

const probabilityAddNewGstin = async (res, batchObjectId, gstIn) => {
  try {
    return await new Promise((resolve, reject) => {
      gstRepo.getAllMisMatchedDataNew(batchObjectId, gstIn).then((data) => {
        // //console.log(data)
        gstRepo.updateProbability(batchObjectId, gstIn);
        let gstData = []
        data.forEach(element => {
          gstData.push(...element.gstInData)
        })
        // //console.log(gstData)
        let groupedTemplatedData = groupBy(gstData, "type");
        // //console.log(groupedTemplatedData)
        let sortResponseData = [];
        if (groupedTemplatedData["templateOne"] && groupedTemplatedData["templateTwo"]) {
          let tempOne = groupBy(groupedTemplatedData["templateOne"], "totalSumAmount")
          let tempTwo = groupBy(groupedTemplatedData["templateTwo"], "totalSumAmount")
          let keys = Object.keys(tempOne);
          // //console.log(keys)
          keys.forEach((element) => {
            // //console.log(element)
            //geting all element of list
            if (tempOne[element] && tempTwo[element]) {
              tempOne[element].forEach(element1 => {
                element1.sgstMatched = true
                element1.igstMatched = true
                element1.cgstMatched = true
                element1.gstInMatched = true
              });
              tempTwo[element].forEach(element1 => {
                element1.sgstMatched = true
                element1.igstMatched = true
                element1.cgstMatched = true
                element1.gstInMatched = true
              });
              sortResponseData.push(...tempOne[element],...tempTwo[element])
            }else{
              if (tempOne[element]) {
                sortResponseData.push(...tempOne[element])
              }
              if (tempTwo[element]){
                sortResponseData.push(...tempTwo[element])
              }
              
            }
          });
        }else{
          if (groupedTemplatedData["templateOne"]) {
            sortResponseData.push(...groupedTemplatedData["templateOne"])
          }
          if (groupedTemplatedData["templateTwo"]){
            sortResponseData.push(...groupedTemplatedData["templateTwo"])
          }
        }
        // //console.log(sortResponseData)
        let newDataGroup = groupBy(sortResponseData, "type");
        // //console.log(newDataGroup)
        if (newDataGroup["templateOne"]) {
          newDataGroup["templateOne"].forEach((element) => {
            //console.log(element)
            gstRepo.setProbabilityData(batchObjectId, element, "templateOne");
          });
        }
        if (newDataGroup["templateTwo"]) {
          newDataGroup["templateTwo"].forEach((element) => {
            gstRepo.setProbabilityData(batchObjectId, element, "templateTwo");
          });
        }

        resolve();
      });
    });
  } catch (error) {
    //console.log(error);
  }
};

const probabilityAddGstin = (batchObjectId, res, gstIn) => {
  probabilityAddNewGstin(res, batchObjectId, gstIn)
    .then(() => {
      setTimeout(() => {
        gstRepo.gstTempleteDataGstIn(batchObjectId, gstIn).then((data) => {
          let responseData = [];
          let newResponseData = [];
          let sortResponseData = []
          //match all doceoments
          data.forEach((element) => {
            responseData.push(...element.gstInData);
          });
          // let totalMap = groupBy(responseData, "totalSumAmount");
          // let keys = Object.keys(totalMap);
          // keys.forEach(element => {
          //   //geting all element of list
          //   let newTotal = totalMap[element]
          //   let groupTemplateList = groupBy(newTotal, "type")
          //   if (groupTemplateList["templateOne"] && groupTemplateList["templateTwo"]) {
          //     groupTemplateList["templateOne"].forEach(element1 => {
          //       element1.sgstMatched = true
          //       element1.cgstMatched = true
          //       element1.igstMatched = true
          //     })
          //     groupTemplateList["templateTwo"].forEach(element1 => {
          //       element1.sgstMatched = true
          //       element1.cgstMatched = true
          //       element1.igstMatched = true
          //     })
          //     sortResponseData.push(...groupTemplateList["templateOne"])
          //     sortResponseData.push(...groupTemplateList["templateTwo"])
          //   }
          //   else{
          //     sortResponseData.push(...totalMap[element])
          //   }
          // });
          let allMisMatched = groupBy(responseData, "gstIn");
          // ////console.log(allMisMatched)
          const uniqueArray = responseData.filter((item, index, arr) => {
            return index === arr.findIndex((obj) => obj.gstIn === item.gstIn);
          });
          // ////console.log(uniqueArray)
          uniqueArray.forEach((element) => {
            let newUpdatedData = [];
            let newData = [];
            let templateOne = groupBy(allMisMatched[element["gstIn"]], "type");
            let templateId = groupBy(templateOne["templateOne"], "templeteId");
            let referenceTemplateId = groupBy(
              templateOne["templateTwo"],
              "referenceTemplateId"
            );
            let keysList = [...new Set(Object.keys(templateId))];
            if (keysList.length > 0) {
              keysList.forEach((element1) => {
                // ////console.log(element1
                if (referenceTemplateId[element1]) {
                  newData.push(
                    ...templateId[element1],
                    ...referenceTemplateId[element1]
                  );
                  delete templateId[element1];
                  delete referenceTemplateId[element1];
                } else {
                  newData.push(...templateId[element1]);
                  delete templateId[element1];
                }
              });
            }
            // ////console.log(newData)
            newUpdatedData = [
              ...newData,
              ...Object.values(referenceTemplateId).flat(),
            ];
            newResponseData.push({
              gstIn: element.gstIn,
              templateData: newUpdatedData,
            });
          });
          // // res.cacheControl('private', { maxAge: 3600});
          return errors.render(newResponseData, res, 200);
        });
      },150)
      // Send the response with status code 201 after the Promise is resolved
      //get updated json
      
    })
    .catch((error) => {
      // If there was an error during execution, send an error response
      return res
        .status(500)
        .json({ error: "An error occurred during data comparison." });
    });
};


const probabilityExistsGstin = (batchObjectId, res, gstIn, type)=> {
  gstRepo.probabilityExistsGstin(batchObjectId, gstIn, type).then((data) => {
    errors.render({}, res, 200);

  });
}
const getMatchNumber = async(res, batchObjectId) => {
  await  gstRepo.getMatchNumber(batchObjectId).then((data) => {
    // //console.log(data);
   errors.render(data, res, 200);
  })
}



module.exports = {
  gstData,
  compareGstData,
  getMatchedDataAll,
  getNotMached,
  partialMatched,
  getTemplateData,
  compareGstDataNew,
  moveData,
  getBatchId,
  compareGstDataNewProbability,
  approveGstData,
  getManualMatched,
  getMatchedDataAllManual,
  getMatchedDataAllProbable,
  getMatchedDataAllMatched,
  getGstin,
  probabilityAddGstin,
  probabilityAddNewGstin,
  probabilityExistsGstin,
  getMatchNumber
};
