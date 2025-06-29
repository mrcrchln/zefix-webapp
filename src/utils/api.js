import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Calls the 'searchCompany' Firebase Cloud Function.
 * @param {string} companyName The name of the company to search for.
 * @returns {Promise<object>} A promise that resolves with the function's response.
 *                            The response object is expected to have a `success` boolean
 *                            and a `data` field (if successful) or an `error` field.
 * @throws {Error} If the Cloud Function call fails.
 */
export const callSearchCompanyFunction = async (companyName) => {
  if (!companyName || companyName.trim() === '') {
    return { success: false, error: 'Company name cannot be empty.' };
  }

  try {
    // Note: 'searchCompany' is the name we exported the function as in functions/index.js
    // For onRequest functions, we would typically use fetch or axios to call the HTTP endpoint.
    // However, Firebase SDK also allows invoking onRequest (HTTP) functions if they are configured
    // to handle callable-like requests or if we construct the URL.
    // Let's use fetch to call the HTTP endpoint directly for clarity with onRequest.

    // First, we need to get the region of the functions if it's not us-central1 (the default)
    // For now, assuming 'us-central1' or that the function is deployed to the default region.
    // You can get the function URL from the Firebase console after deployment
    // or construct it: https://<region>-<project-id>.cloudfunctions.net/searchCompany
    // To make this work locally with the emulator, the URL will be different.

    // For deployed functions:
    // const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
    // const region = 'us-central1'; // Or your function's region
    // const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/searchCompany`;

    // For local emulator (default port 5001 for functions):
    // This requires REACT_APP_FIREBASE_PROJECT_ID to be set in your .env.local or similar
    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id-if-not-set"; // Fallback for safety
    const functionUrl = `http://localhost:5001/${projectId}/us-central1/searchCompany`;

    // When calling an onRequest function directly via HTTP POST,
    // ensure the body is stringified JSON and Content-Type is application/json.
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: companyName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from function.' }));
      console.error('Error calling searchCompany function:', response.status, errorData);
      return { success: false, error: `Function call failed with status ${response.status}`, details: errorData };
    }

    const result = await response.json();
    return result; // Expected to be { success: boolean, data?: any, error?: string }

  } catch (error) {
    console.error('Error calling searchCompany function:', error);
    // Differentiate network errors from other errors if possible
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { success: false, error: 'Network error. Ensure the Firebase Functions emulator is running or the function is deployed.', details: error.message };
    }
    return { success: false, error: 'An unexpected error occurred while calling the function.', details: error.message };
  }
};
