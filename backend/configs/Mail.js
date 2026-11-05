import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

/**
 * Checks whether valid email credentials are provided in .env
 */
const isEmailConfigured = () => {
  const email = process.env.EMAIL?.trim()
  const pass = process.env.EMAIL_PASS?.trim()

  if (!email || !pass) return false
  if (email.includes("add your") || pass.includes("add your")) return false
  return true
}

/**
 * Creates and returns Nodemailer transporter
 */
const getTransporter = () => {
  return nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL?.trim(),
      pass: process.env.EMAIL_PASS?.trim(),
    },
    // Prevent hanging requests with reasonable timeouts
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,
    socketTimeout: 15000,
  })
}

/**
 * Sends OTP email using Nodemailer with HTML template
 * @param {string} to - Recipient email address
 * @param {string} otp - 4-digit OTP code
 */
const sendMail = async (to, otp) => {
  if (!isEmailConfigured()) {
    console.warn("\n========================================================")
    console.warn("⚠️ [EMAIL SERVICE WARNING]: EMAIL or EMAIL_PASS not configured in backend/.env!")
    console.warn(`🔑 [DEV CONSOLE OTP]: OTP for ${to} is: [ ${otp} ] (Valid for 5 minutes)`)
    console.warn("👉 To send real emails, set EMAIL and a Gmail 16-character App Password in backend/.env")
    console.warn("========================================================\n")
    
    // In development without SMTP credentials, allow testing via console OTP
    if (process.env.NODE_ENV !== "production") {
      return { success: true, devMode: true, message: "Logged to console in dev mode" }
    } else {
      throw new Error("Email service is not configured on the server. Please contact administrator.")
    }
  }

  const transporter = getTransporter()

  const htmlContent = `
    <div style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #111827; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Virtual Courses LMS</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
      </div>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 16px 0;">Use the following verification code to reset your password:</p>
        <div style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 12px 28px; border-radius: 8px; margin-bottom: 12px;">
          ${otp}
        </div>
        <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin: 0;">⏳ This code expires in 5 minutes</p>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
        If you did not request a password reset, please ignore this email or change your password if you suspect unauthorized access. Never share this OTP with anyone.
      </p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} Virtual Courses LMS. All rights reserved.
      </p>
    </div>
  `

  try {
    const info = await transporter.sendMail({
      from: `"Virtual Courses LMS" <${process.env.EMAIL}>`,
      to,
      subject: "Your Password Reset OTP - Virtual Courses",
      text: `Your OTP for password reset is ${otp}. It expires in 5 minutes. Do not share this with anyone.`,
      html: htmlContent,
    })

    console.log(`📧 [Mail Sent] OTP successfully delivered to ${to} (Message ID: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`❌ [Mail Error] Failed to send email to ${to}:`, error.message)
    throw new Error(`Email delivery failed: ${error.message}`)
  }
}

export default sendMail