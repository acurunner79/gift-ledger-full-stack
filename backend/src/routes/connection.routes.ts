import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.middleware.js";

export const connectionRouter = Router();

const connectionRequestSchema = z.object({
  email: z.string().email()
});

function getSingleRouteParam(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getCanonicalUserPair(userIdA: string, userIdB: string) {
  return userIdA < userIdB
    ? { userAId: userIdA, userBId: userIdB }
    : { userAId: userIdB, userBId: userIdA };
}

function getOtherUser(
  currentUserId: string,
  connection: {
    userAId: string;
    userBId: string;
    userA: {
      id: string;
      email: string;
      displayName: string;
      giftNote: string | null;
      avatarUrl: string | null;
      themePreference: string;
    };
    userB: {
      id: string;
      email: string;
      displayName: string;
      giftNote: string | null;
      avatarUrl: string | null;
      themePreference: string;
    };
  }
) {
  return connection.userAId === currentUserId
    ? connection.userB
    : connection.userA;
}

connectionRouter.get(
  "/search",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const emailQuery = getSingleRouteParam(req.query.email);

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!emailQuery) {
      res.status(400).json({
        message: "Email query is required"
      });
      return;
    }

    const email = emailQuery.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: {
        email
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        giftNote: true,
        avatarUrl: true,
        themePreference: true
      }
    });

    if (!user || user.id === userId) {
      res.json({
        user: null
      });
      return;
    }

    const { userAId, userBId } = getCanonicalUserPair(userId, user.id);

    const existingConnection = await prisma.userConnection.findUnique({
      where: {
        userAId_userBId: {
          userAId,
          userBId
        }
      },
      select: {
        id: true,
        status: true,
        requestedById: true
      }
    });

    res.json({
      user,
      existingConnection
    });
  }
);

connectionRouter.get(
  "/",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    const connections = await prisma.userConnection.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }]
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        userA: {
          select: {
            id: true,
            email: true,
            displayName: true,
            giftNote: true,
            avatarUrl: true,
            themePreference: true
          }
        },
        userB: {
          select: {
            id: true,
            email: true,
            displayName: true,
            giftNote: true,
            avatarUrl: true,
            themePreference: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            email: true,
            displayName: true
          }
        }
      }
    });

    const acceptedConnections = connections
      .filter((connection) => connection.status === "ACCEPTED")
      .map((connection) => ({
        id: connection.id,
        status: connection.status,
        user: getOtherUser(userId, connection),
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      }));

    const incomingRequests = connections
      .filter(
        (connection) =>
          connection.status === "PENDING" && connection.requestedById !== userId
      )
      .map((connection) => ({
        id: connection.id,
        status: connection.status,
        user: getOtherUser(userId, connection),
        requestedBy: connection.requestedBy,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      }));

    const outgoingRequests = connections
      .filter(
        (connection) =>
          connection.status === "PENDING" && connection.requestedById === userId
      )
      .map((connection) => ({
        id: connection.id,
        status: connection.status,
        user: getOtherUser(userId, connection),
        requestedBy: connection.requestedBy,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      }));

    const declinedConnections = connections
      .filter((connection) => connection.status === "DECLINED")
      .map((connection) => ({
        id: connection.id,
        status: connection.status,
        user: getOtherUser(userId, connection),
        requestedBy: connection.requestedBy,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt
      }));

    res.json({
      acceptedConnections,
      incomingRequests,
      outgoingRequests,
      declinedConnections
    });
  }
);

connectionRouter.post(
  "/request",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    const parsed = connectionRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid connection request data",
        errors: parsed.error.flatten()
      });
      return;
    }

    const targetEmail = parsed.data.email.toLowerCase().trim();

    const targetUser = await prisma.user.findUnique({
      where: {
        email: targetEmail
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        giftNote: true,
        avatarUrl: true,
        themePreference: true
      }
    });

    if (!targetUser) {
      res.status(404).json({
        message: "User not found"
      });
      return;
    }

    if (targetUser.id === userId) {
      res.status(400).json({
        message: "You cannot connect with yourself"
      });
      return;
    }

    const { userAId, userBId } = getCanonicalUserPair(userId, targetUser.id);

    const existingConnection = await prisma.userConnection.findUnique({
      where: {
        userAId_userBId: {
          userAId,
          userBId
        }
      }
    });

    if (existingConnection?.status === "ACCEPTED") {
      res.status(409).json({
        message: "You are already connected with this user"
      });
      return;
    }

    if (existingConnection?.status === "PENDING") {
      res.status(409).json({
        message: "A connection request is already pending"
      });
      return;
    }

    if (existingConnection?.status === "BLOCKED") {
      res.status(403).json({
        message: "Connection is not available"
      });
      return;
    }

    const connection = existingConnection
      ? await prisma.userConnection.update({
          where: {
            id: existingConnection.id
          },
          data: {
            requestedById: userId,
            status: "PENDING"
          }
        })
      : await prisma.userConnection.create({
          data: {
            userAId,
            userBId,
            requestedById: userId,
            status: "PENDING"
          }
        });

    res.status(201).json({
      connection,
      user: targetUser
    });
  }
);

connectionRouter.patch(
  "/:connectionId/accept",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const connectionId = getSingleRouteParam(req.params.connectionId);

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!connectionId) {
      res.status(400).json({
        message: "Invalid connection id"
      });
      return;
    }

    const connection = await prisma.userConnection.findFirst({
      where: {
        id: connectionId,
        status: "PENDING",
        OR: [{ userAId: userId }, { userBId: userId }]
      },
      include: {
        userA: {
          select: {
            id: true,
            email: true,
            displayName: true,
            giftNote: true,
            avatarUrl: true,
            themePreference: true
          }
        },
        userB: {
          select: {
            id: true,
            email: true,
            displayName: true,
            giftNote: true,
            avatarUrl: true,
            themePreference: true
          }
        }
      }
    });

    if (!connection) {
      res.status(404).json({
        message: "Connection request not found"
      });
      return;
    }

    if (connection.requestedById === userId) {
      res.status(403).json({
        message: "You cannot accept your own connection request"
      });
      return;
    }

    const updatedConnection = await prisma.userConnection.update({
      where: {
        id: connection.id
      },
      data: {
        status: "ACCEPTED"
      },
      include: {
        userA: {
          select: {
            id: true,
            email: true,
            displayName: true,
            giftNote: true,
            avatarUrl: true,
            themePreference: true
          }
        },
        userB: {
          select: {
            id: true,
            email: true,
            displayName: true,
            giftNote: true,
            avatarUrl: true,
            themePreference: true
          }
        }
      }
    });

    res.json({
      connection: {
        id: updatedConnection.id,
        status: updatedConnection.status,
        user: getOtherUser(userId, updatedConnection),
        createdAt: updatedConnection.createdAt,
        updatedAt: updatedConnection.updatedAt
      }
    });
  }
);

connectionRouter.patch(
  "/:connectionId/decline",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;
    const connectionId = getSingleRouteParam(req.params.connectionId);

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!connectionId) {
      res.status(400).json({
        message: "Invalid connection id"
      });
      return;
    }

    const connection = await prisma.userConnection.findFirst({
      where: {
        id: connectionId,
        status: "PENDING",
        OR: [{ userAId: userId }, { userBId: userId }]
      }
    });

    if (!connection) {
      res.status(404).json({
        message: "Connection request not found"
      });
      return;
    }

    if (connection.requestedById === userId) {
      res.status(403).json({
        message: "You cannot decline your own connection request"
      });
      return;
    }

    await prisma.userConnection.update({
      where: {
        id: connection.id
      },
      data: {
        status: "DECLINED"
      }
    });

    res.json({
      message: "Connection request declined"
    });
  }
);