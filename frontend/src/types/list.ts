import type { ConnectionUser } from "./connection";
import type { GiftList } from "./gift";

export type GiftListSummary = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  occasion: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    items: number;
  };
};

export type GiftListsResponse = {
  giftLists: GiftListSummary[];
};

export type CreateGiftListResponse = {
  giftList: GiftListSummary;
};

export type UpdateGiftListResponse = {
  giftList: GiftListSummary;
};

export type GiftListDetailResponse = {
  giftList: GiftList;
};

export type ConnectedGiftListGroup = {
  user: ConnectionUser;
  giftLists: GiftListSummary[];
};

export type ConnectedGiftListsResponse = {
  connectedGiftLists: ConnectedGiftListGroup[];
};