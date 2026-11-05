import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import User from "../models/userModel.js"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { sendOtp, verifyOtp, resetPassword, googleSignup } from "../controllers/authController.js"

import dns from "dns"
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"])
} catch (e) {}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const runTests = async () => {
  console.log("Connecting to MongoDB for test...")
  await mongoose.connect(process.env.MONGODB_URL)
  console.log("Connected to MongoDB")

  const testEmail = "test_auth_audit@example.com"

  // Clean up existing test user
  await User.deleteOne({ email: testEmail })

  // 1. Create a dummy test user
  const hashedPassword = await bcrypt.hash("OldPassword123!", 10)
  const testUser = await User.create({
    name: "Test Audit User",
    email: testEmail,
    password: hashedPassword,
    role: "student",
  })
  console.log(" Created test user:", testUser.email)

  // Mock Express req & res
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      cookieData: {},
      status(code) {
        this.statusCode = code
        return this
      },
      json(data) {
        this.jsonData = data
        return this
      },
      cookie(name, val, opts) {
        this.cookieData[name] = { val, opts }
        return this
      },
    }
    return res
  }

  // TEST 1: sendOtp on nonexistent email
  {
    const req = { body: { email: "nonexistent_random_user_123@example.com" } }
    const res = createMockRes()
    await sendOtp(req, res)
    console.log(`TEST 1 (nonexistent email): Status ${res.statusCode}, Message: ${res.jsonData?.message}`)
    if (res.statusCode !== 404) throw new Error("TEST 1 Failed")
  }

  // TEST 2: sendOtp on valid user
  {
    const req = { body: { email: testEmail } }
    const res = createMockRes()
    await sendOtp(req, res)
    console.log(`TEST 2 (send OTP): Status ${res.statusCode}, Message: ${res.jsonData?.message}`)
    if (res.statusCode !== 200) throw new Error("TEST 2 Failed")
  }

  // TEST 3: Rate limiting / Cooldown on immediate second request
  {
    const req = { body: { email: testEmail } }
    const res = createMockRes()
    await sendOtp(req, res)
    console.log(`TEST 3 (rate limit cooldown): Status ${res.statusCode}, Message: ${res.jsonData?.message}`)
    if (res.statusCode !== 429) throw new Error("TEST 3 Failed (Expected 429)")
  }

  // Fetch stored OTP from DB
  const updatedUser = await User.findOne({ email: testEmail })
  console.log(" Stored hashed OTP:", updatedUser.resetOtp ? "Present (Secure SHA-256)" : "Missing")
  console.log(" Stored OTP expiration:", updatedUser.otpExpires)

  // TEST 4: verifyOtp with WRONG OTP
  {
    const req = { body: { email: testEmail, otp: "0000" } }
    const res = createMockRes()
    await verifyOtp(req, res)
    console.log(`TEST 4 (invalid OTP): Status ${res.statusCode}, Message: ${res.jsonData?.message}`)
    if (res.statusCode !== 400) throw new Error("TEST 4 Failed")
  }

  // In order to test successful OTP verification, let's create a known OTP for test
  const knownOtp = "4321"
  updatedUser.resetOtp = crypto.createHash("sha256").update(knownOtp).digest("hex")
  updatedUser.otpExpires = new Date(Date.now() + 5 * 60 * 1000)
  updatedUser.otpCooldown = new Date(Date.now() - 1000)
  await updatedUser.save()

  // TEST 5: verifyOtp with CORRECT OTP
  {
    const req = { body: { email: testEmail, otp: knownOtp } }
    const res = createMockRes()
    await verifyOtp(req, res)
    console.log(`TEST 5 (valid OTP): Status ${res.statusCode}, Message: ${res.jsonData?.message}`)
    if (res.statusCode !== 200) throw new Error("TEST 5 Failed")
  }

  // Verify DB state after verification
  const verifiedUser = await User.findOne({ email: testEmail })
  console.log(" isOtpVerifed:", verifiedUser.isOtpVerifed)
  console.log(" otpVerifiedExpires:", verifiedUser.otpVerifiedExpires)
  console.log(" resetOtp cleared:", verifiedUser.resetOtp === undefined)

  // TEST 6: resetPassword with short password (< 8 chars)
  {
    const req = { body: { email: testEmail, password: "short" } }
    const res = createMockRes()
    await resetPassword(req, res)
    console.log(`TEST 6 (short password): Status ${res.statusCode}, Message: ${res.jsonData?.message}`)
    if (res.statusCode !== 400) throw new Error("TEST 6 Failed")
  }

  // TEST 7: resetPassword with valid strong password
  {
    const req = { body: { email: testEmail, password: "NewStrongPassword2026!" } }
    const res = createMockRes()
    await resetPassword(req, res)
    console.log(`TEST 7 (password reset success): Status ${res.statusCode}, Message: ${res.jsonData?.message}`)
    if (res.statusCode !== 200) throw new Error("TEST 7 Failed")
  }

  // Verify new password is set and isOtpVerifed is cleared
  const passwordResetUser = await User.findOne({ email: testEmail })
  const isNewPasswordValid = await bcrypt.compare("NewStrongPassword2026!", passwordResetUser.password)
  console.log(" New password matches hash:", isNewPasswordValid)
  console.log(" isOtpVerifed after reset:", passwordResetUser.isOtpVerifed)

  // TEST 8: Re-attempting resetPassword without new OTP verification
  {
    const req = { body: { email: testEmail, password: "AnotherPassword123!" } }
    const res = createMockRes()
    await resetPassword(req, res)
    console.log(`TEST 8 (replay reset without OTP): Status ${res.statusCode}, Message: ${res.jsonData?.message}`)
    if (res.statusCode !== 400) throw new Error("TEST 8 Failed (Expected 400)")
  }

  // Clean up
  await User.deleteOne({ email: testEmail })
  console.log("\n✅ ALL 8 AUTH & OTP UNIT/INTEGRATION TESTS PASSED PERFECTLY!\n")
  await mongoose.disconnect()
}

runTests().catch(err => {
  console.error("Test failed:", err)
  process.exit(1)
})
