import type { ThemePreference } from "../themes";

export type ConnectionUser = {
  id: string;
  email: string;
  displayName: string;
  giftNote: string | null;
  avatarUrl: string | null;
  themePreference: ThemePreference;
};

export type ConnectionSummary = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
  user: ConnectionUser;
  createdAt: string;
  updatedAt: string;
};

export type ConnectionListResponse = {
  acceptedConnections: ConnectionSummary[];
  incomingRequests: ConnectionSummary[];
  outgoingRequests: ConnectionSummary[];
  declinedConnections: ConnectionSummary[];
};

export type ConnectionSearchResponse = {
  user: ConnectionUser | null;
  existingConnection: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
    requestedById: string;
  } | null;
};

export type ConnectionRequestResponse = {
  connection: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
  };
  user: ConnectionUser;
};