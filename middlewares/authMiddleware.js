import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Access token is missing or invalid",
      statusCode: 401,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({
      status: "Unauthorized",
      message: "Access token is invalid",
      statusCode: 401,
    });
  }
};
