// Type declarations for the application

export type DocumentRole = "owner" | "editor" | "viewer";

export interface DocumentWithPermissions {
  id: string;
  title: string;
  ownerId: string;
  content: string | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  permissions: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  }[];
  _count?: {
    versions: number;
  };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  title: string | null;
  content: string | null;
  createdBy: string;
  createdAt: Date;
  description: string | null;
  creator: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface CollaboratorInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  color: string;
  cursor?: {
    anchor: number;
    head: number;
  };
}

export interface SyncStatus {
  state: "synced" | "syncing" | "offline" | "error";
  lastSyncedAt: Date | null;
  pendingChanges: number;
}

export interface AIAction {
  action:
    | "improve"
    | "summarize"
    | "expand"
    | "fix_grammar"
    | "simplify"
    | "translate"
    | "explain";
  label: string;
  icon: string;
  description: string;
}

// Extend next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }
}
