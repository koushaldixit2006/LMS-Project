import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"
import mongoose from "mongoose"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Reliably resolve .env regardless of whether started from root or backend directory
const envPath = fs.existsSync(path.resolve(__dirname, ".env"))
    ? path.resolve(__dirname, ".env")
    : path.resolve(process.cwd(), "backend", ".env")
dotenv.config({ path: envPath })

import connectDb from "./configs/db.js"
import authRouter from "./routes/authRoute.js"
import userRouter from "./routes/userRoute.js"
import courseRouter from "./routes/courseRoute.js"
import paymentRouter from "./routes/paymentRoute.js"
import aiRouter from "./routes/aiRoute.js"
import reviewRouter from "./routes/reviewRoute.js"
import { verifyEnv } from "./utils/checkEnv.js";

// वेरिएबल्स लोड होने के बाद अब इसे वेरीफाई करें
verifyEnv();

let port = process.env.PORT || 8000; // अगर .env से पोर्ट न मिले तो डिफ़ॉल्ट 8000 यूज़ होगा
let app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: true,
    credentials: true
}))
app.use((req, res, next) => {
    console.log(`🌐 [${req.method}] ${req.url} (Origin: ${req.headers.origin || 'none'})`);
    next();
});
app.use("/public", express.static(path.join(__dirname, "public")))

// Routes Setup
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/course", courseRouter)
app.use("/api/payment", paymentRouter)
app.use("/api/ai", aiRouter)
app.use("/api/review", reviewRouter)

app.get("/", (req, res) => {
    res.send("Hello From Server")
});
app.get("/health", (req, res) => {
  const dbReady = mongoose.connection.readyState === 1; // 1 = connected
  res.json({ status: "ok", dbConnected: dbReady });
});

// Server Listen & DB Connection
app.listen(port, "0.0.0.0", async () => {
    console.log(`🚀 Server Started on port ${port} (0.0.0.0)`);
    try {
        await connectDb(); // डेटाबेस कनेक्ट होने का इंतज़ार करें
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
    }
});
