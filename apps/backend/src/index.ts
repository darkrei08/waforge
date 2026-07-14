import { Elysia } from "elysia";
import { PrismaClient } from "@waforge/database";
import Redis from "ioredis";

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl);

const app = new Elysia()
  .get("/", () => "WaForge Elysia Backend is running")
  .group("/webhook", (app) => 
    app
      .post("/gowa", async ({ body }) => {
        // High-performance GoWA webhook receiver
        console.log("[GoWA Webhook] Received payload");
        return { status: "received" };
      })
      .post("/wuzapi", async ({ body, query }) => {
        // High-performance WuzAPI webhook receiver
        const teamId = query.teamId as string;
        if (!teamId) return { error: "Missing teamId" };
        
        try {
          const payload = body as any;
          // Example business logic: Upsert contact, save message, publish via Redis
          // (In a real scenario, full schema validation would be performed)
          
          if (payload?.type === "message" || payload?.event === "message") {
            const sender = payload.sender || payload.from;
            const text = payload.text || payload.message?.conversation;
            
            // Publish the incoming message to Nuxt WebSocket server via Redis
            redis.publish("waforge:events", JSON.stringify({
              teamId,
              event: "new_message",
              data: {
                sender,
                text,
                timestamp: new Date().toISOString()
              }
            }));
            
            return { success: true, status: "processed_and_broadcasted" };
          }

          return { success: true, status: "ignored" };
        } catch (err: any) {
          console.error("[WuzAPI Webhook] Error:", err.message);
          return { error: "Processing failed" };
        }
      })
  )
  .listen(3000);

console.log(
  `🦊 Elysia (Webhooks & DB Proxy) is running at ${app.server?.hostname}:${app.server?.port}`
);
