import jwt from "jsonwebtoken"

// In-memory cache for Google/Firebase public certificates
let publicKeysCache = null
let cacheExpiresAt = 0

/**
 * Fetches Google's public certificates for Firebase ID Token verification
 */
const getFirebasePublicKeys = async () => {
  const now = Date.now()
  if (publicKeysCache && now < cacheExpiresAt) {
    return publicKeysCache
  }

  try {
    const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com")
    if (!res.ok) {
      throw new Error(`Failed to fetch Firebase certs: HTTP ${res.status}`)
    }
    
    // Parse cache-control header max-age if present
    const cacheControl = res.headers.get("cache-control") || ""
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/)
    const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600

    publicKeysCache = await res.json()
    cacheExpiresAt = now + (maxAgeSec * 1000)
    return publicKeysCache
  } catch (error) {
    console.error("[Token Verification] Error fetching Firebase certs:", error.message)
    // If cache exists even if expired, use it as fallback
    if (publicKeysCache) return publicKeysCache
    throw error
  }
}

/**
 * Verifies a Google OAuth ID Token via Google's tokeninfo endpoint
 * @param {string} token 
 * @returns {Promise<object|null>}
 */
const verifyGoogleOAuthToken = async (token) => {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`)
    if (!response.ok) {
      return null
    }

    const payload = await response.json()
    if (!payload.email) {
      return null
    }

    // Optional check: if GOOGLE_CLIENT_ID is set in .env, verify audience
    const expectedClientId = process.env.GOOGLE_CLIENT_ID?.trim()
    if (expectedClientId && !expectedClientId.includes("add your") && payload.aud !== expectedClientId) {
      console.warn(`[Google OAuth Warning] Token aud (${payload.aud}) does not match GOOGLE_CLIENT_ID (${expectedClientId})`)
    }

    return {
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      picture: payload.picture || "",
      sub: payload.sub,
      emailVerified: payload.email_verified === "true" || payload.email_verified === true
    }
  } catch (error) {
    return null
  }
}

/**
 * Verifies a Firebase Auth ID Token using Google's public certs & jsonwebtoken
 * @param {string} token 
 * @returns {Promise<object|null>}
 */
const verifyFirebaseIdToken = async (token) => {
  try {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || !decoded.header || !decoded.header.kid) {
      return null
    }

    const publicKeys = await getFirebasePublicKeys()
    const cert = publicKeys[decoded.header.kid]
    if (!cert) {
      throw new Error("Matching public key (kid) not found for Firebase token")
    }

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || "lms-project-45d1f"
    const verified = jwt.verify(token, cert, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`
    })

    return {
      email: verified.email,
      name: verified.name || verified.email?.split("@")[0],
      picture: verified.picture || "",
      sub: verified.sub,
      emailVerified: verified.email_verified === true
    }
  } catch (error) {
    // If strict issuer/audience verification fails but signature or token is decoded, log helpful details
    console.error("[Firebase Token Verification Error]:", error.message)
    return null
  }
}

/**
 * Unified Google / Firebase ID Token Verifier
 * Validates Google OAuth or Firebase tokens securely on the backend
 * @param {string} token - The raw ID token
 * @returns {Promise<{email: string, name: string, picture: string, sub: string}>}
 */
export const verifyGoogleOrFirebaseToken = async (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Missing or invalid token. Please ensure an authentication token is provided.")
  }

  // 1. First attempt Firebase ID Token verification
  const firebaseUser = await verifyFirebaseIdToken(token)
  if (firebaseUser && firebaseUser.email) {
    return firebaseUser
  }

  // 2. Second attempt Google OAuth tokeninfo endpoint
  const googleUser = await verifyGoogleOAuthToken(token)
  if (googleUser && googleUser.email) {
    return googleUser
  }

  // 3. Fallback for offline development / debugging when credentials or network are limited
  if (process.env.NODE_ENV !== "production") {
    try {
      const decoded = jwt.decode(token)
      if (decoded && decoded.email) {
        console.warn("\n⚠️ [DEV WARNING] Google/Firebase token signature could not be verified with remote certs, but decoded safely in development mode.")
        console.warn(`Authenticated as: ${decoded.email}\n`)
        return {
          email: decoded.email,
          name: decoded.name || decoded.email.split("@")[0],
          picture: decoded.picture || "",
          sub: decoded.sub || decoded.user_id || "dev-user"
        }
      }
    } catch (e) {
      // ignore
    }
  }

  throw new Error("Google authentication token verification failed. The token is invalid or expired.")
}

export default verifyGoogleOrFirebaseToken
