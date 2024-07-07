import request from "supertest";
import { createApp } from "../../server.js";
import jwt from "jsonwebtoken";
import prisma from "../../DB/db.config.js";
import bcrypt from "bcryptjs";

// unit test for auth
jest.mock("bcryptjs");
jest.mock("../../DB/db.config.js", () => {
  return {
    user: {
      findUnique: jest.fn(),
    },
  };
});

describe("POST /auth/login", () => {
  let app;
  let server;
  const mockUser = {
    userId: 1,
    email: "test@example.com",
    password: "hashedpassword",
    firstName: "Test",
    lastName: "User",
    phone: "1234567890",
  };

  beforeAll(() => {
    app = createApp();
    server = app.listen(3002, () => {
      console.log("Test server is running on port 3002");
    });
    prisma.user.findUnique.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
  });

  afterAll((done) => {
    server.close(done);
  });

  it("should generate a token with correct user details and expiration", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password" });

    console.log(response.body);

    expect(response.status).toBe(200); // Ensure response status is 200
    expect(response.body).toHaveProperty("data.accessToken");

    const { accessToken } = response.body.data;
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);

    expect(decodedToken.userId).toBe(mockUser.userId);
    expect(decodedToken.exp - decodedToken.iat).toBe(3600); // 1 hour
  });
});
