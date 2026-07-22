import type { ConnectionUser } from "./connection";

export type GiftPriority = "HIGH" | "MEDIUM" | "LOW";

export type GiftAlternative = {
  id: string;
  giftItemId: string;
  name: string;
  link: string | null;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GiftItem = {
  id: string;
  listId: string;
  ownerId: string;
  itemName: string;
  itemLink: string | null;
  itemDescription: string | null;
  quantity: number;
  priority: GiftPriority;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  alternatives: GiftAlternative[];
  claimSummary?: GiftClaimSummary | null;
  viewerClaim?: GiftViewerClaim | null;
  viewerClaimSummary?: GiftViewerClaimSummary | null;
};

export type GiftList = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  occasion: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  items: GiftItem[];
};

export type MyGiftListResponse = {
  giftList: GiftList;
};

export type CreateGiftItemResponse = {
  giftItem: GiftItem;
};

export type GiftClaimStatus = "RESERVED" | "PURCHASED" | "CANCELLED";

export type GiftClaimSummary = {
  totalReserved: number;
  totalPurchased: number;
  totalClaimed: number;
  availableQuantity: number;
};

export type GiftViewerClaimSummary = {
  reservedQuantity: number;
  purchasedQuantity: number;
  totalQuantity: number;
};

export type GiftViewerClaim = {
  id: string;
  quantityClaimed: number;
  status: GiftClaimStatus;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GiftClaimAvailability = {
  quantity: number;
  claimedQuantity: number;
  availableQuantity: number;
};

export type GiftClaimResponse = {
  claim: GiftViewerClaim;
  availability: GiftClaimAvailability;
};

export type ConnectedUserGiftListResponse = {
  owner: ConnectionUser;
  giftList: GiftList | null;
};