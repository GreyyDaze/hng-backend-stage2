import prisma from "../DB/db.config.js";

export const getUserById = async (req, res) => {
  const requestedUserId = req.params.id;
  const authenticatedUserId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: requestedUserId,
      },
      include: {
        organisations: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message: "User not found",
        statusCode: 404,
      });
    }

    if (
      user.userId !== authenticatedUserId &&
      !user.organisations.some((org) =>
        org.users.some((u) => u.userId === authenticatedUserId)
      )
    ) {
      return res.status(403).json({
        status: "Forbidden",
        message: "Unauthorized access",
        statusCode: 403,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User details retrieved successfully",
      data: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      status: "Server error",
      message: "Failed to fetch user details",
      statusCode: 500,
    });
  }
};

export const getUserOrganisations = async (req, res) => {
  const authenticatedUserId = req.user.userId;
  // console.log(authenticatedUserId, 'authenticatedUserId');

  try {
    const user = await prisma.user.findUnique({
      where: {
        userId: authenticatedUserId,
      },
      include: {
        organisations: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message: "User not found",
        statusCode: 404,
      });
    }

    console.log(user, "user");

    const userOrganisations = user.organisations.map((org) => ({
      orgId: org.orgId,
      name: org.name,
      description: org.description,
    }));

    return res.status(200).json({
      status: "success",
      message: "User organisations retrieved successfully",
      data: {
        organisations: userOrganisations,
      },
    });
  } catch (error) {
    console.error("Error fetching user organisations:", error);
    res.status(500).json({
      status: "Server error",
      message: "Failed to fetch user details",
      statusCode: 500,
    });
  }
};

export const getOrganisationById = async (req, res) => {
  const orgId = req.params.orgId;
  const authenticatedUserId = req.user.userId;
  try {
    const organisation = await prisma.organisation.findUnique({
      where: {
        orgId: orgId,
      },
      include: {
        users: true,
      },
    });

    if (!organisation) {
      return res.status(404).json({
        status: "Not Found",
        message: "Organisation not found",
        statusCode: 404,
      });
    }
    console.log(organisation, "organisation");

    const isUserAuthorized = organisation.users.some(
      (user) => user.userId === authenticatedUserId
    );

    if (!isUserAuthorized) {
      return res.status(403).json({
        status: "Forbidden",
        message: "Unauthorized access",
        statusCode: 403,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Organisation details retrieved successfully",
      data: {
        orgId: organisation.orgId,
        name: organisation.name,
        description: organisation.description,
      },
    });
  } catch (error) {
    console.error("Error fetching user organisations:", error);
    res.status(500).json({
      status: "Server error",
      message: "Failed to fetch user details",
      statusCode: 500,
    });
  }
};

// POST /api/organisations
export const createOrganisation = async (req, res) => {
  const { name, description } = req.body;
  const authenticatedUserId = req.user.userId;

  try {
    if (!name) {
      return res.status(400).json({
        status: "Bad Request",
        message: "Client error",
        statusCode: 400,
      });
    }

    const newOrganisation = await prisma.organisation.create({
      data: {
        name,
        description,
        users: {
          connect: { userId: authenticatedUserId },
        },
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Organisation created successfully",
      data: {
        orgId: newOrganisation.orgId,
        name: newOrganisation.name,
        description: newOrganisation.description,
      },
    });
  } catch (error) {
    console.error("Error creating organisation:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

export const addUserToOrganisation = async (req, res) => {
  const { orgId } = req.params;
  const { userId } = req.body;

  try {
    const organisation = await prisma.organisation.findUnique({
      where: { orgId },
      include: { users: true },
    });

    if (!organisation) {
      return res.status(404).json({
        status: "Not Found",
        message: "Organisation not found",
        statusCode: 404,
      });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({
        status: "Not Found",
        message: "User not found",
        statusCode: 404,
      });
    }

    const userExistsInOrg = organisation.users.some((u) => u.userId === userId);
    if (userExistsInOrg) {
      return res.status(400).json({
        status: "Bad Request",
        message: "User is already connected to the organisation",
        statusCode: 400,
      });
    }

    await prisma.organisation.update({
      where: { orgId },
      data: {
        users: {
          connect: { userId },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "User added to organisation successfully",
    });
  } catch (error) {
    console.error("Error adding user to organisation:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      statusCode: 500,
    });
  }
};
