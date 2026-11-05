/**
 * Translates Firebase, Axios, and JavaScript errors into human-readable messages
 * @param {any} error 
 * @returns {string} User-friendly error message
 */
export const getAuthErrorMessage = (error) => {
  if (!error) return "An unknown error occurred."

  // 1. Check for Firebase Auth Error Codes
  if (error.code) {
    switch (error.code) {
      case "auth/api-key-not-valid":
      case "auth/invalid-api-key":
        return "Google Sign-In is not configured: Invalid or placeholder VITE_FIREBASE_APIKEY in frontend/.env."
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed before completing login."
      case "auth/cancelled-popup-request":
        return "Sign-in request was cancelled."
      case "auth/popup-blocked":
        return "Popup was blocked by your browser. Please allow popups for this site."
      case "auth/unauthorized-domain":
        return "Current domain (e.g. localhost) is not in Firebase Authorized Domains (Firebase Console > Auth > Settings)."
      case "auth/operation-not-allowed":
        return "Google Sign-In is disabled in Firebase Console. Please enable Google under Authentication > Sign-in method."
      case "auth/network-request-failed":
        return "Network error connecting to Google servers. Please check your internet connection."
      default:
        return error.message || "Google authentication failed."
    }
  }

  // 2. Check for Axios Server Response Errors
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  // 3. Fallback to standard error message or generic string
  return error.message || "Authentication failed. Please try again."
}
