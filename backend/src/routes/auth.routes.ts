import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  type AuthenticatedRequest
} from "../middleware/auth.middleware.js";
import { createAuthToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(80),
  password: z.string().min(8).max(120)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid registration data",
      errors: parsed.error.flatten()
    });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const displayName = parsed.data.displayName.trim();
  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        displayName,
        passwordHash,
        giftLists: {
          create: {
            title: `${displayName}'s Gift List`,
            description: "My default gift list",
            occasion: "General",
            isDefault: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        giftNote: true,
        avatarUrl: true,
        themePreference: true,
        createdAt: true
      }
    });

    const token = createAuthToken({
      userId: user.id,
      email: user.email
    });

    res.status(201).json({
      user,
      token
    });
  } catch (error: unknown) {
    const knownError = error as { code?: string };

    if (knownError.code === "P2002") {
      res.status(409).json({
        message: "An account with this email already exists"
      });
      return;
    }

    console.error("Registration failed:", error);

    res.status(500).json({
      message: "Registration failed"
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid login data",
      errors: parsed.error.flatten()
    });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    res.status(401).json({
      message: "Invalid email or password"
    });
    return;
  }

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    res.status(401).json({
      message: "Invalid email or password"
    });
    return;
  }

  const token = createAuthToken({
    userId: user.id,
    email: user.email
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      giftNote: user.giftNote,
      avatarUrl: user.avatarUrl,
      themePreference: user.themePreference,
      createdAt: user.createdAt
    },
    token
  });
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      message: "Unauthorized"
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      giftNote: true,
      avatarUrl: true,
      themePreference: true,
      createdAt: true,
      updatedAt: true,
      giftLists: {
        select: {
          id: true,
          title: true,
          description: true,
          occasion: true,
          isDefault: true
        }
      }
    }
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