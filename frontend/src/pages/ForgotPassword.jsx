import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'
import { serverUrl } from '../App'
import { toast } from 'react-toastify'
import { getAuthErrorMessage } from '../../utils/handleAuthError'
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from "react-icons/md"

function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newpassword, setNewPassword] = useState("")
  const [conPassword, setConPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConPassword, setShowConPassword] = useState(false)

  // Timers for Step 2
  const [resendCooldown, setResendCooldown] = useState(0) // in seconds (e.g. 60s)
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(0) // in seconds (e.g. 300s = 5m)

  // Countdown effect for resend cooldown and OTP expiration
  useEffect(() => {
    let interval = null
    if (step === 2) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
        setOtpExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step])

  // Helper to format seconds into mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // STEP 1: Send OTP to email
  const handleStep1 = async (e) => {
    if (e) e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      const msg = "Please enter your email address."
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      console.log(`[ForgotPassword] Requesting OTP for: ${trimmedEmail}`)
      const result = await axios.post(
        `${serverUrl}/api/auth/sendotp`,
        { email: trimmedEmail },
        { withCredentials: true }
      )
      console.log("[ForgotPassword] OTP sent response:", result.data)

      const successMsg = result.data.message || "OTP sent successfully to your email."
      setSuccessMessage(successMsg)
      toast.success(successMsg)
      
      if (result.data.devOtp) {
        setOtp(result.data.devOtp)
      }

      // Initialize timers: 60s resend cooldown, 300s (5m) OTP validity
      setResendCooldown(60)
      setOtpExpiryTimer(300)
      setStep(2)
      setLoading(false)
    } catch (error) {
      console.error("[ForgotPassword Step 1 Error]:", error)
      const errorMsg = getAuthErrorMessage(error)
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
  }

  // STEP 2: Verify OTP
  const handleStep2 = async (e) => {
    if (e) e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    const cleanOtp = otp.trim()
    if (!cleanOtp) {
      const msg = "Please enter the 4-digit OTP sent to your email."
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    if (cleanOtp.length !== 4) {
      const msg = "OTP must be exactly 4 digits."
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    if (otpExpiryTimer === 0) {
      const msg = "Your OTP has expired. Please click 'Resend OTP' to get a new code."
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      console.log(`[ForgotPassword] Verifying OTP for: ${email.trim()}`)
      const result = await axios.post(
        `${serverUrl}/api/auth/verifyotp`,
        { email: email.trim(), otp: cleanOtp },
        { withCredentials: true }
      )
      console.log("[ForgotPassword] OTP verification response:", result.data)

      const successMsg = result.data.message || "OTP verified successfully."
      setSuccessMessage(successMsg)
      toast.success(successMsg)
      setStep(3)
      setLoading(false)
    } catch (error) {
      console.error("[ForgotPassword Step 2 Error]:", error)
      const errorMsg = getAuthErrorMessage(error)
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
  }

  // STEP 2 - RESEND OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setErrorMessage("")
    setSuccessMessage("")
    setResendLoading(true)

    try {
      console.log(`[ForgotPassword] Resending OTP to: ${email.trim()}`)
      const result = await axios.post(
        `${serverUrl}/api/auth/sendotp`,
        { email: email.trim() },
        { withCredentials: true }
      )
      console.log("[ForgotPassword] Resend OTP response:", result.data)

      const successMsg = result.data.message || "New OTP sent to your email."
      setSuccessMessage(successMsg)
      toast.success(successMsg)

      // Reset timers and clear previous OTP input
      setOtp("")
      setResendCooldown(60)
      setOtpExpiryTimer(300)
      setResendLoading(false)
    } catch (error) {
      console.error("[ForgotPassword Resend Error]:", error)
      const errorMsg = getAuthErrorMessage(error)
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
      setResendLoading(false)
    }
  }

  // STEP 3: Reset Password
  const handleStep3 = async (e) => {
    if (e) e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!newpassword) {
      const msg = "Please enter a new password."
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    if (newpassword.length < 8) {
      const msg = "Password must be at least 8 characters long."
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    if (newpassword !== conPassword) {
      const msg = "Passwords do not match."
      setErrorMessage(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      console.log(`[ForgotPassword] Submitting new password for: ${email.trim()}`)
      const result = await axios.post(
        `${serverUrl}/api/auth/resetpassword`,
        { email: email.trim(), password: newpassword },
        { withCredentials: true }
      )
      console.log("[ForgotPassword] Password reset response:", result.data)

      const successMsg = result.data.message || "Password reset successfully!"
      toast.success(successMsg)
      setSuccessMessage(successMsg)
      setLoading(false)

      setTimeout(() => {
        navigate("/login")
      }, 1500)
    } catch (error) {
      console.error("[ForgotPassword Step 3 Error]:", error)
      const errorMsg = getAuthErrorMessage(error)
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      {/* STEP 1: Enter Email */}
      {step === 1 && (
        <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full border border-gray-100">
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
            Forgot Your Password?
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter your registered email address and we'll send you a 4-digit verification code.
          </p>

          {/* Alert Banners */}
          {errorMessage && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex justify-between items-start">
              <span>{errorMessage}</span>
              <button
                type="button"
                className="text-red-500 font-bold ml-2"
                onClick={() => setErrorMessage("")}
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm flex justify-between items-start">
              <span>{successMessage}</span>
              <button
                type="button"
                className="text-green-500 font-bold ml-2"
                onClick={() => setSuccessMessage("")}
              >
                ✕
              </button>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleStep1}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black text-sm"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-800 text-white py-2.5 px-4 rounded-md font-medium cursor-pointer transition flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <ClipLoader size={22} color="white" /> : "Send OTP"}
            </button>
          </form>

          <div
            className="text-sm text-center mt-6 text-gray-600 hover:text-black cursor-pointer font-medium"
            onClick={() => navigate("/login")}
          >
            ← Back to Login
          </div>
        </div>
      )}

      {/* STEP 2: Enter OTP */}
      {step === 2 && (
        <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full border border-gray-100">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Enter OTP Code
          </h2>
          <p className="text-sm text-gray-500 text-center mb-1">
            We have sent a 4-digit code to:
          </p>
          <p className="text-sm font-semibold text-center text-gray-800 mb-6">
            {email}
          </p>

          {/* Alert Banners */}
          {errorMessage && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex justify-between items-start">
              <span>{errorMessage}</span>
              <button
                type="button"
                className="text-red-500 font-bold ml-2"
                onClick={() => setErrorMessage("")}
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm flex justify-between items-start">
              <span>{successMessage}</span>
              <button
                type="button"
                className="text-green-500 font-bold ml-2"
                onClick={() => setSuccessMessage("")}
              >
                ✕
              </button>
            </div>
          )}

          {/* Timer status */}
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md mb-4 text-xs font-medium">
            <span className="text-gray-600">
              {otpExpiryTimer > 0 ? (
                <>⏳ Code expires in: <span className="text-red-600 font-bold">{formatTime(otpExpiryTimer)}</span></>
              ) : (
                <span className="text-red-600 font-semibold">⚠️ Code expired</span>
              )}
            </span>
            <span className="text-gray-500">4-digit numeric</span>
          </div>

          <form className="space-y-4" onSubmit={handleStep2}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                4-Digit Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={4}
                className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black text-center text-2xl tracking-[12px] font-bold"
                placeholder="••••"
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                value={otp}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-800 text-white py-2.5 px-4 rounded-md font-medium cursor-pointer transition flex items-center justify-center"
              disabled={loading || otpExpiryTimer === 0}
            >
              {loading ? <ClipLoader size={22} color="white" /> : "Verify OTP"}
            </button>
          </form>

          {/* Resend OTP Section */}
          <div className="mt-5 text-center text-sm border-t pt-4">
            <p className="text-gray-600 mb-2">Didn't receive the email?</p>
            {resendCooldown > 0 ? (
              <span className="text-gray-400 text-xs font-medium">
                Resend code available in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                className="text-black font-semibold hover:underline cursor-pointer disabled:opacity-50"
                onClick={handleResendOtp}
                disabled={resendLoading}
              >
                {resendLoading ? "Sending new code..." : "Resend OTP"}
              </button>
            )}
          </div>

          <div
            className="text-sm text-center mt-4 text-gray-600 hover:text-black cursor-pointer font-medium"
            onClick={() => {
              setStep(1)
              setErrorMessage("")
              setSuccessMessage("")
            }}
          >
            ← Change email address
          </div>
        </div>
      )}

      {/* STEP 3: Reset Password */}
      {step === 3 && (
        <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full border border-gray-100">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Reset Your Password
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter a new password for <span className="font-semibold">{email}</span>. Minimum 8 characters.
          </p>

          {/* Alert Banners */}
          {errorMessage && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm flex justify-between items-start">
              <span>{errorMessage}</span>
              <button
                type="button"
                className="text-red-500 font-bold ml-2"
                onClick={() => setErrorMessage("")}
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded text-sm flex justify-between items-start">
              <span>{successMessage}</span>
              <button
                type="button"
                className="text-green-500 font-bold ml-2"
                onClick={() => setSuccessMessage("")}
              >
                ✕
              </button>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleStep3}>
            {/* New Password */}
            <div className="relative">
              <label htmlFor="newpassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="newpassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none text-sm pr-10"
                onChange={(e) => setNewPassword(e.target.value)}
                value={newpassword}
                required
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-500 hover:text-black cursor-pointer"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? <MdRemoveRedEye size={18} /> : <MdOutlineRemoveRedEye size={18} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label htmlFor="conPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="conPassword"
                type={showConPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none text-sm pr-10"
                onChange={(e) => setConPassword(e.target.value)}
                value={conPassword}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-500 hover:text-black cursor-pointer"
                onClick={() => setShowConPassword((prev) => !prev)}
              >
                {showConPassword ? <MdRemoveRedEye size={18} /> : <MdOutlineRemoveRedEye size={18} />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-800 text-white py-2.5 rounded-md font-medium cursor-pointer transition flex items-center justify-center mt-2"
              disabled={loading}
            >
              {loading ? <ClipLoader size={22} color="white" /> : "Reset Password"}
            </button>
          </form>

          {/* Back to login */}
          <div
            className="text-center text-sm mt-6 text-gray-600 hover:text-black cursor-pointer font-medium"
            onClick={() => navigate("/login")}
          >
            ← Back to Login
          </div>
        </div>
      )}
    </div>
  )
}

export default ForgotPassword
