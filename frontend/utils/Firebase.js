import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { initializeApp, getApps, getApp } from "firebase/app"

const apiKey = import.meta.env.VITE_FIREBASE_APIKEY?.trim()

const activeApiKey = (apiKey && !apiKey.includes("add your") && !apiKey.includes("your_"))
  ? apiKey
  : "AIzaSyANflYyzLldcO0hS7TnbMb9JwmSfa67jRk"

export const isFirebaseConfigured = () => {
  return Boolean(activeApiKey && activeApiKey.startsWith("AIzaSy"))
}

const firebaseConfig = {
  apiKey: activeApiKey,
  authDomain: "lms-project-45d1f.firebaseapp.com",
  projectId: "lms-project-45d1f",
  storageBucket: "lms-project-45d1f.firebasestorage.app",
  messagingSenderId: "177112608884",
  appId: "1:177112608884:web:496845da32403dab816121",
  measurementId: "G-FBHEL9MH6S"
}

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)

const provider = new GoogleAuthProvider()
// Prompt user to select an account each time
provider.setCustomParameters({
  prompt: "select_account",
})

export { auth, provider, app }