import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.middleware.js";

export const giftRouter = Router();

function getSingleRouteParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

function getCanonicalUserPair(userIdA: string, userIdB: string) {
  return userIdA < userIdB
    ? { userAId: userIdA, userBId: userIdB }
    : { userAId: userIdB, userBId: userIdA };
}

async function getConnectedUserOrFail(viewerId: string, ownerId: string) {
  const owner = await prisma.user.findUnique({
    where: {
      id: ownerId
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

  if (!owner) {
    return {
      owner: null,
      isOwnerViewingOwnList: false,
      isConnected: false
    };
  }

  const isOwnerViewingOwnList = viewerId === ownerId;

  if (isOwnerViewingOwnList) {
    return {
      owner,
      isOwnerViewingOwnList,
      isConnected: true
    };
  }

  const { userAId, userBId } = getCanonicalUserPair(viewerId, ownerId);

  const connection = await prisma.userConnection.findUnique({
    where: {
      userAId_userBId: {
        userAId,
        userBId
      }
    }
  });

  return {
    owner,
    isOwnerViewingOwnList,
    isConnected: connection?.status === "ACCEPTED"
  };
}

async function getRawGiftListWithClaims(options: {
  ownerId: string;
  listId: string;
}) {
  return prisma.giftList.findFirst({
    where: {
      ownerId: options.ownerId,
      id: options.listId
    },
    include: {
      items: {
        where: {
          isActive: true
        },
        orderBy: {
          createdAt: "desc"
        },
        include: {
          alternatives: {
            orderBy: {
              sortOrder: "asc"
            }
          },
          claims: {
            where: {
              status: {
                in: ["RESERVED", "PURCHASED"]
              }
            },
            select: {
              id: true,
              purchaserId: true,
              quantityClaimed: true,
              status: true,
              purchasedAt: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }
    }
  });
}

function buildViewerSafeGiftList(
  rawGiftList: NonNullable<Awaited<ReturnType<typeof getRawGiftListWithClaims>>>,
  viewerId: string,
  isOwnerViewingOwnList: boolean
) {
  return {
    ...rawGiftList,
    items: rawGiftList.items.map((item) => {
      const { claims, ...safeItem } = item;

      if (isOwnerViewingOwnList) {
        return {
          ...safeItem,
          claimSummary: null,
          viewerClaim: null,
          viewerClaimSummary: null
        };
      }

      const totalReserved = claims
        .filter((claim) => claim.status === "RESERVED")
        .reduce((sum, claim) => sum + claim.quantityClaimed, 0);

      const totalPurchased = claims
        .filter((claim) => claim.status === "PURCHASED")
        .reduce((sum, claim) => sum + claim.quantityClaimed, 0);

      const viewerReservedClaim = claims.find(
        (claim) =>
          claim.purchaserId === viewerId && claim.status === "RESERVED"
      );

      const viewerPurchasedQuantity = claims
        .filter(
          (claim) =>
            claim.purchaserId === viewerId && claim.status === "PURCHASED"
        )
        .reduce((sum, claim) => sum + claim.quantityClaimed, 0);

      const viewerReservedQuantity = viewerReservedClaim?.quantityClaimed ?? 0;

      return {
        ...safeItem,
        claimSummary: {
          totalReserved,
          totalPurchased,
          totalClaimed: totalReserved + totalPurchased,
          availableQuantity: Math.max(
            safeItem.quantity - totalReserved - totalPurchased,
            0
          )
        },
        viewerClaim: viewerReservedClaim
          ? {
              id: viewerReservedClaim.id,
              quantityClaimed: viewerReservedClaim.quantityClaimed,
              status: viewerReservedClaim.status,
              purchasedAt: viewerReservedClaim.purchasedAt,
              createdAt: viewerReservedClaim.createdAt,
              updatedAt: viewerReservedClaim.updatedAt
            }
          : null,
        viewerClaimSummary: {
          reservedQuantity: viewerReservedQuantity,
          purchasedQuantity: viewerPurchasedQuantity,
          totalQuantity: viewerReservedQuantity + viewerPurchasedQuantity
        }
      };
    })
  };
}

giftRouter.get(
  "/users/:userId/lists/:listId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const viewerId = req.user?.userId;
    const ownerId = getSingleRouteParam(req.params.userId);
    const listId = getSingleRouteParam(req.params.listId);

    if (!viewerId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!ownerId || !listId) {
      res.status(400).json({
        message: "Invalid user or list id"
      });
      return;
    }

    const { owner, isOwnerViewingOwnList, isConnected } =
      await getConnectedUserOrFail(viewerId, ownerId);

    if (!owner) {
      res.status(404).json({
        message: "User not found"
      });
      return;
    }

    if (!isConnected) {
      res.status(403).json({
        message: "You are not connected with this user"
      });
      return;
    }

    const rawGiftList = await getRawGiftListWithClaims({
      ownerId,
      listId
    });

    if (!rawGiftList) {
      res.status(404).json({
        message: "Gift list not found"
      });
      return;
    }

    const giftList = buildViewerSafeGiftList(
      rawGiftList,
      viewerId,
      isOwnerViewingOwnList
    );

    res.json({
      owner,
      giftList
    });
  }
);