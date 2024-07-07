import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";

export function createApp() {
  dotenv.config();
  const app = express();

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  // Routes
  app.use("/auth", authRoutes);
  app.use("/api", systemRoutes);

  return app;
}

// Create the app
const app = createApp();

// Export a function for Vercel
export default function (req, res) {
  return app(req, res);
}

// Only run the server if we're not in a Vercel environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}