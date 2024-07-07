import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../DB/db.config.js";

export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;

  console.log(req.body);
  if (!firstName || !lastName || !email || !password) {
    return res.status(422).json({
      errors: [
        !firstName && { field: "firstName", message: "First name is required" },
        !lastName && { field: "lastName", message: "Last name is required" },
        !email && { field: "email", message: "Email is required" },
        !password && { field: "password", message: "Password is required" },
      ].filter(Boolean),
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(422).json({
        errors: [{ field: "email", message: "Email already exists" }],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
      },
    });

    const organisationName = `${firstName}'s Organisation`;
    await prisma.organisation.create({
      data: {
        name: organisationName,
        description: "Default Organisation",
        users: {
          connect: { userId: user.userId },
        },
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Response
    res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: {
        accessToken: token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "Bad request",
      message: "Registration unsuccessful",
      statusCode: 400,
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({
      errors: [
        !email && { field: "email", message: "Email is required" },
        !password && { field: "password", message: "Password is required" },
      ].filter(Boolean),
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({
        status: "Bad request",
        message: "Authentication failed",
        statusCode: 401,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "Bad request",
        message: "Authentication failed",
        statusCode: 401,
      });
    }

    

    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        accessToken: token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    res.status(401).json({
      status: "Bad request",
      message: "Authentication failed",
      statusCode: 401,
    });
  }
};
