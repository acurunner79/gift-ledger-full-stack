import type { ThemePreference } from "../themes";

export type GiftListSummary = {
  id: string;
  title: string;
  description: string | null;
  occasion: string | null;
  isDefault: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  giftNote: string | null;
  avatarUrl: string | null;
  themePreference: ThemePreference;
  createdAt: string;
  updatedAt?: string;
  giftLists?: GiftListSummary[];
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type MeResponse = {
  user: AuthUser;
};