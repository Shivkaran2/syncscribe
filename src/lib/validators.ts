import { z } from "zod";
import { MAX_SYNC_PAYLOAD_SIZE, MAX_DOCUMENT_TITLE_LENGTH } from "@/lib/utils";

// ==================== AUTH VALIDATORS ====================

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ==================== DOCUMENT VALIDATORS ====================

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(MAX_DOCUMENT_TITLE_LENGTH, `Title must be under ${MAX_DOCUMENT_TITLE_LENGTH} characters`),
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(MAX_DOCUMENT_TITLE_LENGTH)
    .optional(),
});

// ==================== SYNC VALIDATORS ====================

export const syncPayloadSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  update: z
    .string()
    .max(MAX_SYNC_PAYLOAD_SIZE, "Sync payload too large (max 1MB)")
    .describe("Base64 encoded Yjs update"),
  clientId: z.string().min(1, "Client ID required"),
});

// ==================== VERSION VALIDATORS ====================

export const createVersionSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  description: z.string().max(500, "Description too long").optional(),
  title: z.string().max(MAX_DOCUMENT_TITLE_LENGTH).optional(),
});

export const restoreVersionSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  versionId: z.string().uuid("Invalid version ID"),
});

// ==================== PERMISSION VALIDATORS ====================

export const shareDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["editor", "viewer"], {
    message: "Role must be 'editor' or 'viewer'",
  }),
});

export const updatePermissionSchema = z.object({
  permissionId: z.string().uuid("Invalid permission ID"),
  role: z.enum(["editor", "viewer"]),
});

// ==================== AI VALIDATORS ====================

export const aiActionSchema = z.object({
  action: z.enum([
    "improve",
    "summarize",
    "expand",
    "fix_grammar",
    "simplify",
    "translate",
    "explain",
  ]),
  text: z
    .string()
    .min(1, "Text is required")
    .max(10000, "Text too long (max 10,000 characters)"),
  language: z.string().optional(),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type SyncPayload = z.infer<typeof syncPayloadSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type RestoreVersionInput = z.infer<typeof restoreVersionSchema>;
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>;
export type AIActionInput = z.infer<typeof aiActionSchema>;
