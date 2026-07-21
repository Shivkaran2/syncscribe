import fs from "node:fs";
import path from "node:path";

// This process runs outside Next.js, which means nothing loads `.env` for us.
// Load it manually for local development; in hosted environments (Render) the
// file is absent and the variables are injected into the process directly, so
// this is skipped without failing.
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] || "").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Never override variables the host already provided.
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import prisma from "../src/lib/prisma";

const server = new Server({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 1234,
  timeout: 30000,
  
  async onAuthenticate(data) {
    return {
      user: { id: "anonymous" }
    };
  },

  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        try {
          const doc = await prisma.document.findUnique({
            where: { id: documentName }
          });
          
          if (doc && doc.yDocState) {
            return doc.yDocState;
          }
          return null;
        } catch (error) {
          console.error("Error fetching document:", error);
          return null;
        }
      },
      store: async ({ documentName, state }) => {
        try {
          await prisma.document.update({
            where: { id: documentName },
            data: {
              yDocState: Buffer.from(state),
              updatedAt: new Date()
            }
          });
        } catch (error) {
          console.error("Error storing document:", error);
        }
      }
    })
  ]
});

server.listen().then(({ port }: any) => {
  console.log(`Hocuspocus WebSocket server running on port ${port}`);
});
