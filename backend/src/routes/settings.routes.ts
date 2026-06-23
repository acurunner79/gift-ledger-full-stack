import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.middleware.js";

export const settingsRouter = Router();

const themePreferenceSchema = z.enum([
  "NORTH_POLE",
  "REBEL_ALLIANCE",
  "SWIFTIE_ERA",
  "WINTER_FROST"
]);

const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  giftNote: z.string().max(500).nullable().optional()
});

const appearanceUpdateSchema = z.object({
  themePreference: themePreferenceSchema
});

const userSettingsSelect = {
  id: true,
  email: true,
  displayName: true,
  giftNote: true,
  avatarUrl: true,
  themePreference: true,
  createdAt: true,
  updatedAt: true
};

settingsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      message: "Unauthorized"
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSettingsSelect
  });

  if (!user) {
    res.status(404).json({
      message: "User not found"
    });
    return;
  }

  res.json({
    user
  });
});

settingsRouter.patch(
  "/profile",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    const parsed = profileUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid profile data",
        errors: parsed.error.flatten()
      });
      return;
    }

    const updateData: {
      displayName?: string;
      giftNote?: string | null;
    } = {};

    if (parsed.data.displayName !== undefined) {
      updateData.displayName = parsed.data.displayName.trim();
    }

    if (parsed.data.giftNote !== undefined) {
      updateData.giftNote =
        parsed.data.giftNote === null ? null : parsed.data.giftNote.trim();
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: userSettingsSelect
    });

    res.json({
      user
    });
  }
);

settingsRouter.patch(
  "/appearance",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized"
      });
      return;
    }

    const parsed = appearanceUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid appearance data",
        errors: parsed.error.flatten()
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        themePreference: parsed.data.themePreference
      },
      select: userSettingsSelect
    });

    res.json({
      user
    });
  }
);