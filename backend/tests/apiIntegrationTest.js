// tests/apiIntegrationTest.js

import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import cloudinary from "cloudinary";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";

dotenv.config();

const results = [];

// Gemini test (just instantiate, no network call)
try {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  if (ai) results.push({ name: "Gemini", status: "OK" });
} catch (e) {
  results.push({ name: "Gemini", status: "FAIL", error: e.message });
}

// Cloudinary config test
try {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  results.push({ name: "Cloudinary", status: "OK" });
} catch (e) {
  results.push({ name: "Cloudinary", status: "FAIL", error: e.message });
}

// Gmail (SMTP) test – create transporter
try {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });
  results.push({ name: "Gmail SMTP", status: "OK" });
} catch (e) {
  results.push({ name: "Gmail SMTP", status: "FAIL", error: e.message });
}

// Razorpay test – instantiate client
try {
  const rp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });
  results.push({ name: "Razorpay", status: "OK" });
} catch (e) {
  results.push({ name: "Razorpay", status: "FAIL", error: e.message });
}

console.log("API Integration Test Results:\n", results);
process.exit();
