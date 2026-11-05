import { genToken } from "../configs/token.js"
import validator from "validator"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import User from "../models/userModel.js"
import sendMail from "../configs/Mail.js"
import { verifyGoogleOrFirebaseToken } from "../utils/verifyGoogleToken.js"

export const signUp = async (req, res) => {
  try {
    let { name, email, password, role } = req.body
    const normalizedEmail = email ? email.toLowerCase().trim() : ""
    
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Please provide all required fields (name, email, password)" })
    }

    let existUser = await User.findOne({ email: normalizedEmail })
    if (existUser) {
      return res.status(400).json({ message: "Email already exists. Please login instead." })
    }
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address" })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" })
    }

    const validRole = role === "educator" ? "educator" : "student"
    let hashPassword = await bcrypt.hash(password, 10)
    let user = await User.create({
      name,
      email: normalizedEmail,
      password: hashPassword,
      role: validRole,
    })

    let token = await genToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    const userObj = user.toObject()
    delete userObj.password
    delete userObj.resetOtp
    delete userObj.otpExpires

    return res.status(201).json(userObj)
  } catch (error) {
    console.error("❌ signUp error:", error)
    return res.status(500).json({ message: `Sign up failed: ${error.message || error}` })
  }
}

export const login = async (req, res) => {
  try {
    let { email, password } = req.body
    const normalizedEmail = email ? email.toLowerCase().trim() : ""

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Please provide both email and password" })
    }

    let user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(400).json({ message: "No account found with this email" })
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account was registered via Google Sign-In. Please sign in with Google.",
      })
    }

    let isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password. Please try again." })
    }

    let token = await genToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    const userObj = user.toObject()
    delete userObj.password
    delete userObj.resetOtp
    delete userObj.otpExpires

    return res.status(200).json(userObj)
  } catch (error) {
    console.error("❌ login error:", error)
    return res.status(500).json({ message: `Login failed: ${error.message || error}` })
  }
}

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    return res.status(200).json({ message: "Logged out successfully" })
  } catch (error) {
    return res.status(500).json({ message: `Logout error: ${error.message || error}` })
  }
}

/**
 * Google Sign-In endpoint
 * Validates Google/Firebase ID Token, retrieves verified user info, and creates session/JWT.
 */
export const googleSignup = async (req, res) => {
  try {
    const { idToken, googleIdToken, role, email: fallbackEmail, name: fallbackName } = req.body
    const tokenToVerify = idToken || googleIdToken

    let verifiedUser = null

    if (tokenToVerify) {
      verifiedUser = await verifyGoogleOrFirebaseToken(tokenToVerify)
    } else if (process.env.NODE_ENV !== "production" && fallbackEmail) {
      console.warn("⚠️ [DEV WARNING] googleSignup called without idToken. Using fallback credentials in dev mode.")
      verifiedUser = {
        email: fallbackEmail,
        name: fallbackName || fallbackEmail.split("@")[0],
        picture: "",
      }
    } else {
      return res.status(400).json({ message: "Google ID token is required for authentication." })
    }

    const normalizedEmail = verifiedUser.email.toLowerCase().trim()
    let user = await User.findOne({ email: normalizedEmail })

    const validRole = role === "educator" ? "educator" : "student"

    if (!user) {
      user = await User.create({
        name: verifiedUser.name || fallbackName || "User",
        email: normalizedEmail,
        role: validRole,
        photoUrl: verifiedUser.picture || "",
      })
      console.log(`✨ [New User] Created new user via Google Sign-In: ${normalizedEmail} (${validRole})`)
    } else {
      // Update photo if missing
      if (verifiedUser.picture && !user.photoUrl) {
        user.photoUrl = verifiedUser.picture
        await user.save()
      }
      console.log(`👤 [Existing User] Authenticated existing user via Google: ${normalizedEmail}`)
    }

    let token = await genToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    const userObj = user.toObject()
    delete userObj.password
    delete userObj.resetOtp
    delete userObj.otpExpires

    return res.status(200).json(userObj)
  } catch (error) {
    console.error("❌ googleSignup error:", error.message)
    return res.status(401).json({ message: `Google Sign-In failed: ${error.message}` })
  }
}

/**
 * Generates and sends OTP with rate limiting & expiration
 */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: "Please provide an email address." })
    }

    const normalizedEmail = email.toLowerCase().trim()
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address." })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." })
    }

    // Rate limiting: 60-second cooldown between OTP requests
    if (user.otpCooldown && user.otpCooldown > Date.now()) {
      const remainingSeconds = Math.ceil((user.otpCooldown - Date.now()) / 1000)
      return res.status(429).json({
        message: `Please wait ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""} before requesting a new OTP.`,
      })
    }

    // Cryptographically secure 4-digit OTP (1000 to 9999)
    const otp = crypto.randomInt(1000, 10000).toString()

    // Hash OTP before storing in database for security
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex")

    user.resetOtp = hashedOtp
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    user.otpCooldown = new Date(Date.now() + 60 * 1000) // 60 seconds cooldown
    user.otpAttempts = 0
    user.isOtpVerifed = false

    await user.save()

    // Send email using Nodemailer (awaited!)
    let mailResult = null
    try {
      mailResult = await sendMail(normalizedEmail, otp)
    } catch (mailError) {
      console.error("❌ sendMail error:", mailError.message)
      // Clear OTP since delivery failed
      user.resetOtp = undefined
      user.otpExpires = undefined
      user.otpCooldown = undefined
      await user.save()
      return res.status(500).json({
        message: `Failed to send OTP email: ${mailError.message}. Check backend SMTP settings.`,
      })
    }

    const isDev = mailResult?.devMode || false
    return res.status(200).json({
      message: isDev
        ? `[DEV MODE] OTP generated: ${otp} (Valid for 5 mins. For real emails, configure Gmail in backend/.env)`
        : "OTP sent successfully to your email. Valid for 5 minutes.",
      devOtp: isDev ? otp : undefined,
    })
  } catch (error) {
    console.error("❌ sendOtp error:", error)
    return res.status(500).json({ message: `Send OTP error: ${error.message || error}` })
  }
}

/**
 * Verifies OTP with attempt limit and expiration check
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are both required." })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    if (!user.resetOtp || !user.otpExpires) {
      return res.status(400).json({
        message: "No active OTP request found. Please request a new OTP code.",
      })
    }

    // Check expiration
    if (new Date(user.otpExpires).getTime() < Date.now()) {
      user.resetOtp = undefined
      user.otpExpires = undefined
      await user.save()
      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP code.",
      })
    }

    // Check brute-force attempts limit (max 5)
    if (user.otpAttempts >= 5) {
      user.resetOtp = undefined
      user.otpExpires = undefined
      await user.save()
      return res.status(429).json({
        message: "Too many failed attempts. This OTP has been invalidated for security. Please request a new one.",
      })
    }

    // Compare hashed OTP
    const hashedInput = crypto.createHash("sha256").update(otp.toString().trim()).digest("hex")

    if (hashedInput !== user.resetOtp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1
      await user.save()
      const remaining = 5 - user.otpAttempts
      return res.status(400).json({
        message: `Invalid OTP. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : "OTP has been invalidated."}`,
      })
    }

    // Success: mark verified and set a 10-minute window to reset password
    user.isOtpVerifed = true
    user.otpVerifiedExpires = new Date(Date.now() + 10 * 60 * 1000)
    user.resetOtp = undefined
    user.otpExpires = undefined
    user.otpAttempts = 0
    await user.save()

    return res.status(200).json({
      message: "OTP verified successfully. You may now enter your new password.",
    })
  } catch (error) {
    console.error("❌ verifyOtp error:", error)
    return res.status(500).json({ message: `Verify OTP error: ${error.message || error}` })
  }
}

/**
 * Resets user password once OTP verification has passed
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: "Email and new password are required." })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    if (!user.isOtpVerifed) {
      return res.status(400).json({
        message: "OTP verification required. Please verify OTP first.",
      })
    }

    if (!user.otpVerifiedExpires || new Date(user.otpVerifiedExpires).getTime() < Date.now()) {
      user.isOtpVerifed = false
      user.otpVerifiedExpires = undefined
      await user.save()
      return res.status(400).json({
        message: "OTP verification session expired. Please request and verify a new OTP.",
      })
    }

    const hashPassword = await bcrypt.hash(password, 10)
    user.password = hashPassword
    user.isOtpVerifed = false
    user.otpVerifiedExpires = undefined
    user.otpCooldown = undefined
    await user.save()

    return res.status(200).json({
      message: "Password reset successfully. You can now login with your new password.",
    })
  } catch (error) {
    console.error("❌ resetPassword error:", error)
    return res.status(500).json({ message: `Reset password error: ${error.message || error}` })
  }
}