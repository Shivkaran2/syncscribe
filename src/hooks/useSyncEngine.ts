"use client";

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useOnlineStatus } from "./useOnlineStatus";
import { SyncStatus } from "@/types";

interface UseSyncEngineOptions {
  documentId: string;
  yDoc: Y.Doc;
  canEdit: boolean;
}

export function useSyncEngine({ documentId, yDoc, canEdit }: UseSyncEngineOptions) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "offline",
    lastSyncedAt: null,
    pendingChanges: 0,
  });

  const { isOnline } = useOnlineStatus();
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const indexeddbRef = useRef<IndexeddbPersistence | null>(null);

  useEffect(() => {
    // 1. Initialize IndexedDB persistence (Local-First Architecture)
    const persistence = new IndexeddbPersistence(`syncdoc-${documentId}`, yDoc);
    indexeddbRef.current = persistence;

    persistence.on("synced", () => {
      console.log("[SyncEngine] Local IndexedDB synced");
    });

    // 2. Initialize Hocuspocus WebSocket Provider for real-time sync
    // Ensure this matches your deployed WS URL or local WS URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234";
    
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: documentId,
      document: yDoc,
      // If user can't edit, don't broadcast their local changes to the server
      // Note: Hocuspocus handles read-only through the connection auth
    });
    
    providerRef.current = provider;

    // Listen to sync events
    provider.on("synced", () => {
      setSyncStatus({
        state: "synced",
        lastSyncedAt: new Date(),
        pendingChanges: 0,
      });
    });

    provider.on("status", ({ status }: { status: string }) => {
      if (status === "connected") {
        setSyncStatus((prev) => ({ ...prev, state: "synced" }));
      } else if (status === "connecting") {
        setSyncStatus((prev) => ({ ...prev, state: "syncing" }));
      } else {
        setSyncStatus((prev) => ({ ...prev, state: "offline" }));
      }
    });

    return () => {
      provider.destroy();
      persistence.destroy();
    };
  }, [documentId, yDoc, canEdit]);

  // Live edits reach the server through the provider on a debounce, so the
  // database copy can lag behind what the user sees. For point-in-time actions
  // (like taking a version snapshot) return the client's authoritative state
  // encoded as base64 so the caller can send it along explicitly.
  const pushToServer = async (): Promise<string> => {
    const state = Y.encodeStateAsUpdate(yDoc);
    let binary = "";
    for (let i = 0; i < state.length; i++) {
      binary += String.fromCharCode(state[i]);
    }
    return btoa(binary);
  };

  return {
    syncStatus,
    pushToServer,
    isOnline,
  };
}
