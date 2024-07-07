import request from "supertest";
import { createApp } from "../../server.js";
import prisma from "../../DB/db.config.js";
import jwt from "jsonwebtoken";

jest.mock("../../DB/db.config.js", () => ({
  user: {
    findUnique: jest.fn(),
  },
  organisation: {
    findMany: jest.fn(),
  },
}));

jest.mock("jsonwebtoken");

describe("GET /api/organisations", () => {
  let app;
  let server;
  const mockUserId = "test-user-id";
  const mockUser = {
    userId: mockUserId,
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    password: "hashedpassword",
    phone: "1234567890",
  };

  beforeAll((done) => {
    app = createApp();
    server = app.listen(3002, () => {
      console.log("Test server is running on port 3002");
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockImplementation((token, secret) => ({ userId: mockUserId }));
  });

  it("should return only organisations the user has access to", async () => {
    const userOrganisations = [
      { orgId: "org1", name: "Organisation 1", description: "Desc 1" },
      { orgId: "org2", name: "Organisation 2", description: "Desc 2" },
    ];

    prisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      organisations: userOrganisations,
    });

    
    const response = await request(app)
      .get("/api/organisations")
      .set("Authorization", "Bearer mock_token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "User organisations retrieved successfully",
      data: { organisations: userOrganisations },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      include: { organisations: true },
    });
    expect(response.body.data.organisations).toHaveLength(2);
    expect(response.body.data.organisations.map((org) => org.orgId)).toEqual([
      "org1",
      "org2",
    ]);
  });

  it("should not return organisations the user doesn't have access to", async () => {
    const userOrganisations = [
      { orgId: "org1", name: "Organisation 1", description: "Desc 1" },
    ];

    const allOrganisations = [
      ...userOrganisations,
      { orgId: "org2", name: "Restricted Org", description: "No Access" },
    ];

    prisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      organisations: userOrganisations,
    });

    prisma.organisation.findMany.mockResolvedValue(allOrganisations);

    const response = await request(app)
      .get("/api/organisations")
      .set("Authorization", "Bearer mock_token");

    expect(response.status).toBe(200);
    expect(response.body.data.organisations).toHaveLength(1);
    expect(response.body.data.organisations[0].orgId).toBe("org1");
    expect(response.body.data.organisations).not.toContainEqual(
      expect.objectContaining({ orgId: "org2" })
    );
  });
});
