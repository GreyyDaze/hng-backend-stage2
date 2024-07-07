import request from "supertest";
import prisma from "../DB/db.config.js";
import bcrypt from "bcryptjs";
import { createApp } from "../server.js";

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.organisation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  let app;
  let server;

  beforeAll(() => {
    app = createApp();
    server = app.listen(3002, () => {
      console.log("Test server is running on port 3002");
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it("should register user successfully with default organisation", async () => {
    const response = await request(app).post("/auth/register").send({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
      phone: "1234567890",
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Registration successful");
    expect(response.body.data).toHaveProperty("accessToken");
    expect(response.body.data.user).toHaveProperty("userId");
    expect(response.body.data.user).toEqual(
      expect.objectContaining({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "1234567890",
      })
    );

    // Verify default organisation
    const user = await prisma.user.findUnique({
      where: { email: "john@example.com" },
      include: { organisations: true },
    });
    expect(user.organisations[0].name).toBe("John's Organisation");
  });

  it("should fail if required fields are missing", async () => {
    const testCases = [
      {
        field: "firstName",
        data: {
          lastName: "Doe",
          email: "jane@example.com",
          password: "password123",
          phone: "1234567890",
        },
      },
      {
        field: "lastName",
        data: {
          firstName: "Jane",
          email: "jane@example.com",
          password: "password123",
          phone: "1234567890",
        },
      },
      {
        field: "email",
        data: {
          firstName: "Jane",
          lastName: "Doe",
          password: "password123",
          phone: "1234567890",
        },
      },
      {
        field: "password",
        data: {
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
          phone: "1234567890",
        },
      },
    ];

    for (const testCase of testCases) {
      const response = await request(app)
        .post("/auth/register")
        .send(testCase.data);

      expect(response.status).toBe(422);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: testCase.field,
          message: expect.stringContaining("required"),
        })
      );
    }

    const allMissingResponse = await request(app)
      .post("/auth/register")
      .send({});

    expect(allMissingResponse.status).toBe(422);
    expect(allMissingResponse.body.errors).toHaveLength(4);
    expect(allMissingResponse.body.errors).toEqual(
      expect.arrayContaining([
        { field: "firstName", message: "First name is required" },
        { field: "lastName", message: "Last name is required" },
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password is required" },
      ])
    );

  });

  it("should fail if there is a duplicate email", async () => {
    // First, register a user
    await request(app).post("/auth/register").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "password123",
      phone: "1234567890",
    });

    // Try to register again with the same email
    const response = await request(app).post("/auth/register").send({
      firstName: "John",
      lastName: "Smith",
      email: "jane@example.com",
      password: "anotherpassword",
      phone: "1234567890",
    });

    expect(response.status).toBe(422);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        field: "email",
        message: "Email already exists",
      })
    );
  });
});

describe("POST /auth/login", () => {
  let app;
  let server;

  beforeAll(async () => {
    app = createApp();
    server = app.listen(3002, () => {
      console.log("Test server is running on port 3002");
    });

    const hashedPassword = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: hashedPassword,
        phone: "1234567890",
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    server.close();
  });

  it("should log in user successfully", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe("Login successful");
    expect(response.body.data).toHaveProperty("accessToken");
    expect(response.body.data.user).toHaveProperty("userId");
    expect(response.body.data.user).toEqual(
      expect.objectContaining({
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        phone: "1234567890",
      })
    );
  });

  it("should fail with invalid credentials", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      status: "Bad request",
      message: "Authentication failed",
      statusCode: 401,
    });
  });

  it("should fail when email is missing", async () => {
    const response = await request(app).post("/auth/login").send({
      password: "password123",
    });

    expect(response.status).toBe(422);
    expect(response.body.errors).toContainEqual({
      field: "email",
      message: "Email is required",
    });
  });

  it("should fail when password is missing", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "test@example.com",
    });

    expect(response.status).toBe(422);
    expect(response.body.errors).toContainEqual({
      field: "password",
      message: "Password is required",
    });
  });

 
});
