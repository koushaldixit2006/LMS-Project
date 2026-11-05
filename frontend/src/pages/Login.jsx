import React, { useState } from 'react'
import logo from '../assets/logo.jpg'
import google from '../assets/google.jpg'
import axios from 'axios'
import { serverUrl } from '../App'
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from "react-icons/md"
import { useNavigate } from 'react-router-dom'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth, provider, isFirebaseConfigured } from '../../utils/Firebase'
import { getAuthErrorMessage } from '../../utils/handleAuthError'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    setAuthError("")

    if (!email || !password) {
      const msg = "Please enter both email and password."
      setAuthError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      dispatch(setUserData(result.data))
      toast.success("Login Successfully")
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.error("[Login Error]:", error)
      const errorMsg = getAuthErrorMessage(error)
      setAuthError(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
  }

  const googleLogin = async () => {
    setAuthError("")

    // Pre-check for Firebase setup
    if (!isFirebaseConfigured()) {
      const msg = "Google Sign-In is not configured: Please set a valid VITE_FIREBASE_APIKEY in frontend/.env"
      console.warn("[Google Auth Warning]:", msg)
      setAuthError(msg)
      toast.error(msg)
      return
    }

    setGoogleLoading(true)
    try {
      console.log(" Initiating Google Sign-In popup...")
      const response = await signInWithPopup(auth, provider)
      console.log(" Google Sign-In popup completed successfully:", response.user.email)

      // Capture Firebase ID Token & Google OAuth ID token
      const idToken = await response.user.getIdToken()
      const credential = GoogleAuthProvider.credentialFromResult(response)
      const googleIdToken = credential?.idToken

      const payload = {
        idToken,
        googleIdToken,
        email: response.user.email,
        name: response.user.displayName,
        role: "student", // default role for users logging in via Google
      }

      console.log(" Sending verified Google credentials to backend...")
      const result = await axios.post(
        `${serverUrl}/api/auth/googlesignup`,
        payload,
        { withCredentials: true }
      )

      dispatch(setUserData(result.data))
      toast.success("Login Successfully with Google")
      setGoogleLoading(false)
      navigate("/")
    } catch (error) {
      console.error("[Google Sign-In Error]:", error)
      const errorMsg = getAuthErrorMessage(error)
      setAuthError(errorMsg)
      toast.error(errorMsg)
      setGoogleLoading(false)
    }
  }

  return (
    <div className='bg-[#dddbdb] w-[100vw] h-[100vh] flex items-center justify-center flex-col gap-3'>
      <form
        className='w-[90%] md:w-200 min-h-150 bg-[white] shadow-xl rounded-2xl flex overflow-hidden'
        onSubmit={handleLogin}
      >
        <div className='md:w-[50%] w-[100%] h-[100%] flex flex-col items-center justify-center gap-4 py-8 px-4'>
          <div className='text-center'>
            <h1 className='font-semibold text-[black] text-2xl'>Welcome back</h1>
            <h2 className='text-[#999797] text-[18px]'>Login to your account</h2>
          </div>

          {/* Visible Error Banner */}
          {authError && (
            <div className='w-[85%] bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs flex justify-between items-start'>
              <span>{authError}</span>
              <button
                type='button'
                className='ml-2 text-red-500 font-bold hover:text-red-700'
                onClick={() => setAuthError("")}
              >
                ✕
              </button>
            </div>
          )}

          <div className='flex flex-col gap-1 w-[85%] items-start justify-center px-3'>
            <label htmlFor='email' className='font-semibold text-sm'>
              Email
            </label>
            <input
              id='email'
              type='email'
              className='border w-[100%] h-[35px] border-[#e7e6e6] rounded text-[15px] px-[12px] focus:outline-none focus:ring-1 focus:ring-black'
              placeholder='Your email'
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </div>

          <div className='flex flex-col gap-1 w-[85%] items-start justify-center px-3 relative'>
            <label htmlFor='password' className='font-semibold text-sm'>
              Password
            </label>
            <input
              id='password'
              type={show ? "text" : "password"}
              className='border w-[100%] h-[35px] border-[#e7e6e6] rounded text-[15px] px-[12px] focus:outline-none focus:ring-1 focus:ring-black'
              placeholder='***********'
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
            {!show && (
              <MdOutlineRemoveRedEye
                className='absolute w-[20px] h-[20px] cursor-pointer right-[8%] bottom-[20%] text-gray-500'
                onClick={() => setShow(prev => !prev)}
              />
            )}
            {show && (
              <MdRemoveRedEye
                className='absolute w-[20px] h-[20px] cursor-pointer right-[8%] bottom-[20%] text-gray-500'
                onClick={() => setShow(prev => !prev)}
              />
            )}
          </div>

          <button
            type='submit'
            className='w-[80%] h-[40px] bg-black text-white cursor-pointer flex items-center justify-center rounded-[5px] font-medium transition hover:bg-neutral-800'
            disabled={loading || googleLoading}
          >
            {loading ? <ClipLoader size={20} color='white' /> : "Login"}
          </button>

          <span
            className='text-[13px] cursor-pointer text-[#585757] hover:underline'
            onClick={() => navigate("/forgotpassword")}
          >
            Forget your password?
          </span>

          <div className='w-[80%] flex items-center gap-2'>
            <div className='w-[25%] h-[0.5px] bg-[#c4c4c4]'></div>
            <div className='w-[50%] text-[13px] text-[#999797] flex items-center justify-center text-center'>
              Or continue with
            </div>
            <div className='w-[25%] h-[0.5px] bg-[#c4c4c4]'></div>
          </div>

          <button
            type='button'
            className='w-[80%] h-[40px] border border-[#d3d2d2] rounded-[5px] flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition'
            onClick={googleLogin}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ClipLoader size={20} color='black' />
            ) : (
              <>
                <img src={google} alt="Google logo" className='w-[22px]' />
                <span className='text-[15px] text-gray-700 font-medium'>Sign in with Google</span>
              </>
            )}
          </button>

          <div className='text-[#6f6f6f] text-sm'>
            Don't have an account?{" "}
            <span
              className='underline underline-offset-1 text-[black] cursor-pointer font-medium'
              onClick={() => navigate("/signup")}
            >
              Sign up
            </span>
          </div>
        </div>

        <div className='w-[50%] h-[100%] rounded-r-2xl bg-[black] md:flex items-center justify-center flex-col hidden p-8'>
          <img src={logo} className='w-30 shadow-2xl rounded-lg' alt="Logo" />
          <span className='text-[white] text-2xl font-bold mt-4'>VIRTUAL COURSES</span>
        </div>
      </form>
    </div>
  )
}

export default Login
