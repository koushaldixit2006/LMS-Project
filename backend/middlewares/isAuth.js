import jwt from "jsonwebtoken"

const isAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token

        if (!token && req.headers?.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1]
        }

        if (!token) {
            return res.status(401).json({ message: "user doesn't have token" })
        }

        let verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        if (!verifyToken) {
            return res.status(401).json({ message: "user doesn't have valid token" })
        }

        req.userId = verifyToken.userId
        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired, please login again" })
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "user doesn't have valid token" })
        }
        console.error("isAuth error:", error)
        return res.status(500).json({ message: `is auth error ${error.message || error}` })
    }
}

export default isAuth