/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const axios = require("axios"); // Will be installed in the next step

exports.searchCompany = onRequest({cors: true}, async (request, response) => {
  logger.info("searchCompany function triggered", {structuredData: true});

  if (request.method !== "POST") {
    response.status(405).send("Method Not Allowed");
    return;
  }

  const companyName = request.body.name;

  if (!companyName) {
    logger.error("Company name not provided in request body");
    response.status(400).send("Bad Request: 'name' is required in the request body.");
    return;
  }

  const delay = 0.5; // seconds
  await new Promise(resolve => setTimeout(resolve, delay * 1000));

  const zefixApiUrl = "https://www.zefix.admin.ch/ZefixPublicREST/api/v1/company/search";
  const payload = {
    name: companyName,
    activeOnly: true,
  };
  const headers = {
    "Content-Type": "application/json",
    // Add any other necessary headers here, e.g., an API key if Zefix requires one
    // For now, assuming it's an open API as per the Python example
  };

  try {
    logger.info(`Searching for company: ${companyName}`, {structuredData: true});
    const apiResponse = await axios.post(zefixApiUrl, payload, { headers });

    if (apiResponse.status === 200) {
      const data = apiResponse.data;
      if (data && data.length > 0) { // Assuming Zefix returns an array of results
        logger.info(`Company found: ${companyName}`, { data });
        response.status(200).json({ success: true, data: data });
      } else {
        logger.info(`Company not found: ${companyName}`);
        response.status(200).json({ success: false, data: null });
      }
    } else {
      logger.error(`Zefix API error for ${companyName}: Status ${apiResponse.status}`, { responseData: apiResponse.data });
      response.status(apiResponse.status).json({ success: false, error: "Zefix API error", details: apiResponse.data });
    }
  } catch (error) {
    logger.error(`Error calling Zefix API for ${companyName}: ${error.message}`, { error });
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      response.status(error.response.status).json({ success: false, error: "Zefix API request failed", details: error.response.data });
    } else if (error.request) {
      // The request was made but no response was received
      response.status(500).json({ success: false, error: "No response from Zefix API" });
    } else {
      // Something happened in setting up the request that triggered an Error
      response.status(500).json({ success: false, error: "Internal server error while calling Zefix API" });
    }
  }
});
