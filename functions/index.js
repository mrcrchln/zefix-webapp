// functions/index.js
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

exports.checkCompany = onCall(async (request) => {
  const { companyName } = request.data;
  const auth = request.auth;

  logger.info(`checkCompany function triggered for: ${companyName}`, {auth, structuredData: true});

  if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
    logger.error("Validation Error: Company name not provided or invalid.", { companyName });
    throw new HttpsError('invalid-argument', 'The function must be called with "companyName" string argument containing the company name to search for.');
  }

  // Retrieve Zefix API credentials from environment variables
  const zefixUsername = "marc.reichlin@eda.admin.ch";
  const zefixPassword = "sdPHj&Z5";

  if (!zefixUsername || !zefixPassword) {
    logger.error("Server Configuration Error: Zefix API credentials are not set.");
    throw new HttpsError('failed-precondition', 'The server is not configured correctly to contact the Zefix API. Please contact the administrator.');
  }

  // Encode credentials for Basic Authentication
  const credentials = `${zefixUsername}:${zefixPassword}`;
  const token = Buffer.from(credentials).toString('base64');

  const delay = 0.5; // seconds
  await new Promise(resolve => setTimeout(resolve, delay * 1000));

  const zefixApiUrl = "https://www.zefix.admin.ch/ZefixPublicREST/api/v1/company/search";
  const payload = {
    name: companyName.trim(),
    activeOnly: true,
  };
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${token}`,
    "Accept": "application/json"
  };

  try {
    logger.info(`Searching for company: ${companyName} using Zefix API.`, {structuredData: true});
    const apiResponse = await axios.post(zefixApiUrl, payload, { headers });

    if (apiResponse.status === 200) {
      const responseData = apiResponse.data;
      if (responseData && responseData.length > 0) {
        logger.info(`Company found: ${companyName}`, { resultCount: responseData.length });
        return { 
          found: true, 
          companyName: companyName.trim(),
          data: responseData 
        };
      } else {
        logger.info(`Company not found: ${companyName}`);
        return { 
          found: false, 
          companyName: companyName.trim(),
          data: null 
        };
      }
    } else {
      logger.error(`Zefix API error for ${companyName}: Status ${apiResponse.status}`, { responseData: apiResponse.data });
      throw new HttpsError('internal', `Zefix API returned status ${apiResponse.status}`, apiResponse.data);
    }
  } catch (error) {
    logger.error(`Error calling Zefix API for ${companyName}: ${error.message}`, { error });
    if (error instanceof HttpsError) {
      throw error;
    } else if (error.response) {
      logger.error(`API Response Error:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      throw new HttpsError('internal', `Zefix API request failed with status ${error.response.status}`, error.response.data);
    } else if (error.request) {
      throw new HttpsError('unavailable', 'No response received from Zefix API.');
    } else {
      throw new HttpsError('unknown', 'An unexpected error occurred while calling the Zefix API.', error.message);
    }
  }
});