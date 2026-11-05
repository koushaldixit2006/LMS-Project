// utils/checkEnv.js

const requiredVars = [
  "PORT",
  "MONGODB_URL",
  "JWT_SECRET",
  "EMAIL",
  "EMAIL_PASS",
];

const optionalVars = [
  "FIREBASE_PROJECT_ID",
  "GOOGLE_CLIENT_ID",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_SECRET",
  "GEMINI_API_KEY",
];

export const verifyEnv = () => {
  const missing = [];
  const placeholders = [];

  for (const v of requiredVars) {
    const val = process.env[v]?.trim();
    if (!val) {
      missing.push(v);
    } else if (val.toLowerCase().includes("add your") || val.toLowerCase().includes("your_")) {
      placeholders.push(v);
    }
  }

  if (missing.length > 0) {
    console.warn("⚠️ [ENV WARNING] Missing critical environment variables:", missing.join(", "));
  }
  
  if (placeholders.length > 0) {
    console.warn("⚠️ [ENV WARNING] The following variables contain placeholder values and need actual configuration:");
    placeholders.forEach(p => console.warn(`   👉 ${p} in backend/.env`));
  }

  if (missing.length === 0 && placeholders.length === 0) {
    console.log("✅ Core backend environment variables verified successfully.");
  }
};
