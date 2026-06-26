import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import prisma from "../src/lib/prisma";
import * as Y from "yjs";

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
