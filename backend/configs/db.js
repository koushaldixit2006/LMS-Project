import mongoose from "mongoose";
import dns from "dns";

// Fix for Node.js / Windows querySrv ECONNREFUSED when querying MongoDB Atlas SRV records
try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
    console.warn("⚠️ Unable to set custom DNS servers:", e.message);
}

const connectDb = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            console.error('❌ MONGODB_URL is missing in .env. Set it to a valid MongoDB connection string.');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("🔥 MongoDB Connected Successfully!");
    } catch (error) {
        console.error('❌ DB connection failed:', error.message);
        throw error;
    }
}
export default connectDb