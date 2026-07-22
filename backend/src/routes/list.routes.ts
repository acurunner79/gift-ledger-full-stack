import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.middleware.js";

export const listRouter = Router();

const createGiftListSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().nullable(),
  occasion: z.string().trim().max(80).optional().nullable()
});

const updateGiftListSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  occasion: z.string().trim().max(80).optional().nullable()
});

const giftAlternativeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  link: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable()
});

const giftPrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

const createGiftItemSchema = z.object({
  itemName: z.string().trim().min(1).max(120),
  itemLink: z.string().trim().max(500).optional().nullable(),
  itemDescription: z.string().trim().max(1000).optional().nullable(),
  quantity: z.number().int().min(1).max(99).default(1),
  priority: giftPrioritySchema.default("MEDIUM"),
  alternatives: z.array(giftAlternativeSchema).optional().default([])
});

const updateGiftItemSchema = z.object({
  itemName: z.string().trim().min(1).max(120).optional(),
  itemLink: z.string().trim().max(500).optional().nullable(),
  itemDescription: z.string().trim().max(1000).optional().nullable(),
  quantity: z.number().int().min(1).max(99).optional(),
  priority: giftPrioritySchema.optional(),
  alternatives: z.array(giftAlternativeSchema).optional()
});

function getSingleRouteParam(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeOptionalText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

listRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const ownerId = req.user?.userId;

  if (!ownerId) {
    res.status(401).json({
      message: "Unauthorized"
    });
    return;
  }

  const giftLists = await prisma.giftList.findMany({
    where: {
      ownerId
    },
    orderBy: [
      {
        isDefault: "desc"
      },
      {
        createdAt: "desc"
      }
    ],
    include: {
      _count: {
        select: {
          items: {
            where: {
              isActive: true
            }
          }
        }
      }
    }
  });

  res.json({
    giftLists
  });
});

listRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const ownerId = req.user?.userId;

  if (!ownerId) {
    res.status(401).json({
      message: "Unauthorized"
    });
    return;
  }

  const parsed = createGiftListSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid gift list data",
      errors: parsed.error.flatten()
    });
    return;
  }

  const giftList = await prisma.giftList.create({
    data: {
      ownerId,
      title: parsed.data.title,
      description: normalizeOptionalText(parsed.data.description),
      occasion: normalizeOptionalText(parsed.data.occasion),
      isDefault: false
    },
    include: {
      _count: {
        select: {
          items: {
            where: {
              isActive: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    giftList
  });
});

listRouter.get(
  "/connected",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const viewerId = req.user?.userId;

    if (!viewerId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    const connections = await prisma.userConnection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          {
            userAId: viewerId
          },
          {
            userBId: viewerId
          }
        ]
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

    const connectedUsers = connections.map((connection) =>
      connection.userAId === viewerId ? connection.userB : connection.userA
    );

    const connectedUserIds = connectedUsers.map((user) => user.id);

    const giftLists =
      connectedUserIds.length > 0
        ? await prisma.giftList.findMany({
            where: {
              ownerId: {
                in: connectedUserIds
              }
            },
            orderBy: [
              {
                ownerId: "asc"
              },
              {
                isDefault: "desc"
              },
              {
                createdAt: "desc"
              }
            ],
            include: {
              _count: {
                select: {
                  items: {
                    where: {
                      isActive: true
                    }
                  }
                }
              }
            }
          })
        : [];

    const connectedGiftLists = connectedUsers.map((user) => ({
      user,
      giftLists: giftLists.filter((giftList) => giftList.ownerId === user.id)
    }));

    res.json({
      connectedGiftLists
    });
  }
);

listRouter.post(
  "/:listId/items",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const ownerId = req.user?.userId;
    const listId = getSingleRouteParam(req.params.listId);

    if (!ownerId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!listId) {
      res.status(400).json({
        message: "Invalid gift list id"
      });
      return;
    }

    const parsed = createGiftItemSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid gift item data",
        errors: parsed.error.flatten()
      });
      return;
    }

    const giftList = await prisma.giftList.findFirst({
      where: {
        id: listId,
        ownerId
      },
      select: {
        id: true
      }
    });

    if (!giftList) {
      res.status(404).json({
        message: "Gift list not found"
      });
      return;
    }

    const giftItem = await prisma.giftItem.create({
      data: {
        listId: giftList.id,
        ownerId,
        itemName: parsed.data.itemName,
        itemLink: normalizeOptionalText(parsed.data.itemLink),
        itemDescription: normalizeOptionalText(parsed.data.itemDescription),
        quantity: parsed.data.quantity,
        priority: parsed.data.priority,
        alternatives: {
          create: parsed.data.alternatives.map((alternative, index) => ({
            name: alternative.name,
            link: normalizeOptionalText(alternative.link),
            description: normalizeOptionalText(alternative.description),
            sortOrder: index
          }))
        }
      },
      include: {
        alternatives: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    res.status(201).json({
      giftItem
    });
  }
);

listRouter.patch(
  "/:listId/items/:itemId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const ownerId = req.user?.userId;
    const listId = getSingleRouteParam(req.params.listId);
    const itemId = getSingleRouteParam(req.params.itemId);

    if (!ownerId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!listId || !itemId) {
      res.status(400).json({
        message: "Invalid list or item id"
      });
      return;
    }

    const parsed = updateGiftItemSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid gift item data",
        errors: parsed.error.flatten()
      });
      return;
    }

    const existingItem = await prisma.giftItem.findFirst({
      where: {
        id: itemId,
        listId,
        ownerId,
        isActive: true
      },
      select: {
        id: true
      }
    });

    if (!existingItem) {
      res.status(404).json({
        message: "Gift item not found"
      });
      return;
    }

    const updateData = {
      ...(parsed.data.itemName !== undefined && {
        itemName: parsed.data.itemName
      }),
      ...(parsed.data.itemLink !== undefined && {
        itemLink: normalizeOptionalText(parsed.data.itemLink)
      }),
      ...(parsed.data.itemDescription !== undefined && {
        itemDescription: normalizeOptionalText(parsed.data.itemDescription)
      }),
      ...(parsed.data.quantity !== undefined && {
        quantity: parsed.data.quantity
      }),
      ...(parsed.data.priority !== undefined && {
        priority: parsed.data.priority
      }),
    };

    if (parsed.data.alternatives !== undefined) {
      const alternatives = parsed.data.alternatives;

      const giftItem = await prisma.$transaction(async (tx) => {
        await tx.giftAlternative.deleteMany({
          where: {
            giftItemId: itemId
          }
        });

        return tx.giftItem.update({
          where: {
            id: itemId
          },
          data: {
            ...updateData,
            alternatives: {
              create: alternatives.map((alternative, index) => ({
                name: alternative.name,
                link: normalizeOptionalText(alternative.link),
                description: normalizeOptionalText(alternative.description),
                sortOrder: index
              }))
            }
          },
          include: {
            alternatives: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          }
        });
      });

      res.json({
        giftItem
      });
      return;
    }

    const giftItem = await prisma.giftItem.update({
      where: {
        id: itemId
      },
      data: updateData,
      include: {
        alternatives: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    res.json({
      giftItem
    });
  }
);

listRouter.patch(
  "/:listId/items/:itemId/archive",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const ownerId = req.user?.userId;
    const listId = getSingleRouteParam(req.params.listId);
    const itemId = getSingleRouteParam(req.params.itemId);

    if (!ownerId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!listId || !itemId) {
      res.status(400).json({
        message: "Invalid list or item id"
      });
      return;
    }

    const existingItem = await prisma.giftItem.findFirst({
      where: {
        id: itemId,
        listId,
        ownerId,
        isActive: true
      },
      select: {
        id: true
      }
    });

    if (!existingItem) {
      res.status(404).json({
        message: "Gift item not found"
      });
      return;
    }

    const giftItem = await prisma.giftItem.update({
      where: {
        id: itemId
      },
      data: {
        isActive: false
      },
      include: {
        alternatives: {
          orderBy: {
            sortOrder: "asc"
          }
        }
      }
    });

    res.json({
      giftItem
    });
  }
);

listRouter.get(
  "/:listId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const ownerId = req.user?.userId;
    const listId = getSingleRouteParam(req.params.listId);

    if (!ownerId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!listId) {
      res.status(400).json({
        message: "Invalid gift list id"
      });
      return;
    }

    const giftList = await prisma.giftList.findFirst({
      where: {
        id: listId,
        ownerId
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
            }
          }
        }
      }
    });

    if (!giftList) {
      res.status(404).json({
        message: "Gift list not found"
      });
      return;
    }

    res.json({
      giftList
    });
  }
);

listRouter.patch(
  "/:listId",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const ownerId = req.user?.userId;
    const listId = getSingleRouteParam(req.params.listId);

    if (!ownerId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!listId) {
      res.status(400).json({
        message: "Invalid gift list id"
      });
      return;
    }

    const parsed = updateGiftListSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid gift list data",
        errors: parsed.error.flatten()
      });
      return;
    }

    const existingList = await prisma.giftList.findFirst({
      where: {
        id: listId,
        ownerId
      }
    });

    if (!existingList) {
      res.status(404).json({
        message: "Gift list not found"
      });
      return;
    }

    const giftList = await prisma.giftList.update({
      where: {
        id: listId
      },
      data: {
        ...(parsed.data.title !== undefined && {
          title: parsed.data.title
        }),
        ...(parsed.data.description !== undefined && {
          description: normalizeOptionalText(parsed.data.description)
        }),
        ...(parsed.data.occasion !== undefined && {
          occasion: normalizeOptionalText(parsed.data.occasion)
        })
      },
      include: {
        _count: {
          select: {
            items: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });

    res.json({
      giftList
    });
  }
);

listRouter.patch(
  "/:listId/default",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const ownerId = req.user?.userId;
    const listId = getSingleRouteParam(req.params.listId);

    if (!ownerId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    if (!listId) {
      res.status(400).json({
        message: "Invalid gift list id"
      });
      return;
    }

    const existingList = await prisma.giftList.findFirst({
      where: {
        id: listId,
        ownerId
      }
    });

    if (!existingList) {
      res.status(404).json({
        message: "Gift list not found"
      });
      return;
    }

    const [, giftList] = await prisma.$transaction([
      prisma.giftList.updateMany({
        where: {
          ownerId
        },
        data: {
          isDefault: false
        }
      }),
      prisma.giftList.update({
        where: {
          id: listId
        },
        data: {
          isDefault: true
        },
        include: {
          _count: {
            select: {
              items: {
                where: {
                  isActive: true
                }
              }
            }
          }
        }
      })
    ]);

    res.json({
      giftList
    });
  }
);