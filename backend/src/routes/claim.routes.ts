import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.middleware.js";

export const claimRouter = Router();

const reserveClaimSchema = z.object({
  quantityClaimed: z.number().int().min(1).max(99).default(1)
});

function getSingleRouteParam(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getCanonicalUserPair(userIdA: string, userIdB: string) {
  return userIdA < userIdB
    ? { userAId: userIdA, userBId: userIdB }
    : { userAId: userIdB, userBId: userIdA };
}

async function getClaimedQuantity(giftItemId: string) {
  const result = await prisma.giftClaim.aggregate({
    where: {
      giftItemId,
      status: {
        in: ["RESERVED", "PURCHASED"]
      }
    },
    _sum: {
      quantityClaimed: true
    }
  });

  return result._sum.quantityClaimed || 0;
}

async function verifyConnectedToGiftOwner(viewerId: string, ownerId: string) {
  const { userAId, userBId } = getCanonicalUserPair(viewerId, ownerId);

  const connection = await prisma.userConnection.findUnique({
    where: {
      userAId_userBId: {
        userAId,
        userBId
      }
    }
  });

  return connection?.status === "ACCEPTED";
}

async function getAvailability(giftItemId: string, itemQuantity: number) {
  const claimedQuantity = await getClaimedQuantity(giftItemId);

  return {
    quantity: itemQuantity,
    claimedQuantity,
    availableQuantity: Math.max(itemQuantity - claimedQuantity, 0)
  };
}

claimRouter.post(
  "/items/:itemId/reserve",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const purchaserId = req.user?.userId;
    const itemId = getSingleRouteParam(req.params.itemId);

    if (!purchaserId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!itemId) {
      res.status(400).json({
        message: "Invalid gift item id"
      });
      return;
    }

    const parsed = reserveClaimSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid reservation data",
        errors: parsed.error.flatten()
      });
      return;
    }

    const giftItem = await prisma.giftItem.findUnique({
      where: {
        id: itemId
      },
      select: {
        id: true,
        ownerId: true,
        itemName: true,
        quantity: true,
        isActive: true
      }
    });

    if (!giftItem || !giftItem.isActive) {
      res.status(404).json({
        message: "Gift item not found"
      });
      return;
    }

    if (giftItem.ownerId === purchaserId) {
      res.status(403).json({
        message: "You cannot reserve your own gift item"
      });
      return;
    }

    const isConnected = await verifyConnectedToGiftOwner(
      purchaserId,
      giftItem.ownerId
    );

    if (!isConnected) {
      res.status(403).json({
        message: "You are not connected with this gift list owner"
      });
      return;
    }

    const existingReservedClaim = await prisma.giftClaim.findFirst({
      where: {
        giftItemId: giftItem.id,
        purchaserId,
        status: "RESERVED"
      }
    });

    if (existingReservedClaim) {
      res.status(409).json({
        message: "You already have an active reservation for this item"
      });
      return;
    }

    const claimedQuantity = await getClaimedQuantity(giftItem.id);
    const availableQuantity = giftItem.quantity - claimedQuantity;

    if (parsed.data.quantityClaimed > availableQuantity) {
      res.status(409).json({
        message: "Requested quantity is not available",
        availability: {
          quantity: giftItem.quantity,
          claimedQuantity,
          availableQuantity: Math.max(availableQuantity, 0)
        }
      });
      return;
    }

    const claim = await prisma.giftClaim.create({
      data: {
        giftItemId: giftItem.id,
        purchaserId,
        quantityClaimed: parsed.data.quantityClaimed,
        status: "RESERVED"
      }
    });

    const availability = await getAvailability(giftItem.id, giftItem.quantity);

    res.status(201).json({
      claim,
      availability
    });
  }
);

claimRouter.patch(
  "/:claimId/purchase",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const purchaserId = req.user?.userId;
    const claimId = getSingleRouteParam(req.params.claimId);

    if (!purchaserId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!claimId) {
      res.status(400).json({
        message: "Invalid claim id"
      });
      return;
    }

    const existingClaim = await prisma.giftClaim.findFirst({
      where: {
        id: claimId,
        purchaserId,
        status: "RESERVED"
      },
      include: {
        giftItem: {
          select: {
            id: true,
            quantity: true
          }
        }
      }
    });

    if (!existingClaim) {
      res.status(404).json({
        message: "Active reservation not found"
      });
      return;
    }

    const claim = await prisma.giftClaim.update({
      where: {
        id: existingClaim.id
      },
      data: {
        status: "PURCHASED",
        purchasedAt: new Date()
      }
    });

    const availability = await getAvailability(
      existingClaim.giftItem.id,
      existingClaim.giftItem.quantity
    );

    res.json({
      claim,
      availability
    });
  }
);

claimRouter.patch(
  "/:claimId/cancel",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const purchaserId = req.user?.userId;
    const claimId = getSingleRouteParam(req.params.claimId);

    if (!purchaserId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!claimId) {
      res.status(400).json({
        message: "Invalid claim id"
      });
      return;
    }

    const existingClaim = await prisma.giftClaim.findFirst({
      where: {
        id: claimId,
        purchaserId,
        status: "RESERVED"
      },
      include: {
        giftItem: {
          select: {
            id: true,
            quantity: true
          }
        }
      }
    });

    if (!existingClaim) {
      res.status(404).json({
        message: "Active reservation not found"
      });
      return;
    }

    const claim = await prisma.giftClaim.update({
      where: {
        id: existingClaim.id
      },
      data: {
        status: "CANCELLED"
      }
    });

    const availability = await getAvailability(
      existingClaim.giftItem.id,
      existingClaim.giftItem.quantity
    );

    res.json({
      claim,
      availability
    });
  }
);