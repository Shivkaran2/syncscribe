"use client";

import { SyncStatus } from "@/types";
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface SyncStatusProps {
  syncStatus: SyncStatus;
  isOnline: boolean;
}

export default function SyncStatusIndicator({ syncStatus, isOnline }: SyncStatusProps) {
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        className: "sync-offline",
        icon: <WifiOff size={12} />,
        label: "Offline",
        sublabel: "Changes saved locally",
        color: "var(--sync-offline)",
      };
    }

    switch (syncStatus.state) {
      case "synced":
        return {
          className: "sync-synced",
          icon: <Cloud size={12} />,
          label: "Saved",
          sublabel: syncStatus.lastSyncedAt
            ? formatRelativeTime(syncStatus.lastSyncedAt)
            : "",
          color: "var(--sync-synced)",
        };
      case "syncing":
        return {
          className: "sync-syncing",
          icon: <RefreshCw size={12} className="animate-spin-slow" />,
          label: "Saving...",
          sublabel: "",
          color: "var(--sync-syncing)",
        };
      case "error":
        return {
          className: "sync-error",
          icon: <CloudOff size={12} />,
          label: "Sync Error",
          sublabel: "Will retry",
          color: "var(--sync-error)",
        };
      default:
        return {
          className: "sync-synced",
          icon: <Wifi size={12} />,
          label: "Connected",
          sublabel: "",
          color: "var(--sync-synced)",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`sync-indicator ${config.className}`}
      style={{
        background: `${config.color}10`,
        border: `1px solid ${config.color}30`,
        color: config.color,
      }}
      title={`${config.label}${config.sublabel ? ` — ${config.sublabel}` : ""}`}
    >
      <span className="sync-dot" />
      {config.icon}
      <span style={{ fontSize: 11, fontWeight: 500 }}>{config.label}</span>
      {syncStatus.pendingChanges > 0 && (
        <span
          style={{
            fontSize: 10,
            opacity: 0.7,
          }}
        >
          ({syncStatus.pendingChanges})
        </span>
      )}
    </div>
  );
}
