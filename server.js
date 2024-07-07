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

// Only start the server if this file is run directly
if (require.main === module) {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
