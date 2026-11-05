import jwt from "jsonwebtoken"

export const genToken = async (userId) => {
    try {
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined in environment variables")
            throw new Error("JWT_SECRET is not defined")
        }
        let token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
        return token
    } catch (error) {
        console.error("token generation error:", error)
        throw error
    }
}