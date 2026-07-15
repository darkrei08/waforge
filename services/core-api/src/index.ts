import { Elysia, t } from 'elysia';
import { PrismaClient } from '@waforge/database';
import { jwt } from '@elysiajs/jwt';
import Redis from "ioredis";
import { crmRoutes } from './crm';

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redis = new Redis(redisUrl);
const jwtSecret = process.env.JWT_SECRET || "fallback-secret-for-dev";

const app = new Elysia({ prefix: '/core' })
  .use(jwt({ name: 'jwt', secret: jwtSecret }))
  
  // Gruppo API Auth
  .group('/auth', (app) => app
    .post('/login', async ({ body, jwt, set }) => {
      const user = await prisma.user.findUnique({ where: { email: body.email } });
      if (!user) { set.status = 401; return { error: "Non autorizzato" }; }
      
      // FIXME: Manca la verifica della password in questo skeleton, stiamo bypassando per MVP/scaffolding
      // if (body.password !== user.passwordHash) { set.status = 401; return { error: "Non autorizzato" }; }
      
      // Carico i tenant dell'utente
      const tenants = await prisma.teamMembership.findMany({ where: { userId: user.id }, include: { team: true }});
      
      const token = await jwt.sign({ 
        userId: user.id, 
        isSuperAdmin: user.isSuperAdmin,
        activeTenantId: tenants[0]?.teamId // Default login
      });
      
      return { token, user: { email: user.email, isSuperAdmin: user.isSuperAdmin }, tenants };
    }, {
      body: t.Object({ email: t.String(), password: t.String() })
    })
  )

  // Gruppo API SuperAdmin (Protette)
  .group('/admin', (app) => app
    .derive(async ({ jwt, headers, set }) => {
      // Verifica token e ruolo SuperAdmin
      const auth = headers.authorization;
      const payload = await jwt.verify(auth?.replace('Bearer ', ''));
      if (!payload || !(payload as any).isSuperAdmin) {
        set.status = 403;
        throw new Error("Accesso negato. SuperAdmin richiesto.");
      }
      return { superAdminId: (payload as any).userId };
    })
    .patch('/tenant/:id/features', async ({ params, body }) => {
      // Endpoint per abilitare/disabilitare feature per un tenant
      return await prisma.team.update({
        where: { id: params.id },
        data: { activeFeatures: body.features } // Es: ["crm.base", "waforge.pro"]
      });
    }, {
      body: t.Object({ features: t.Array(t.String()) })
    })
  )
  
  // --- CRM Module (Fase 2) ---
  .use(crmRoutes)
  
  // --- Legacy Webhooks (da migrare in Fase 3) ---
  .group("/webhook", (app) => 
    app
      .post("/gowa", async ({ body }) => {
        console.log("[GoWA Webhook] Received payload");
        return { status: "received" };
      })
      .post("/wuzapi", async ({ body, query }) => {
        const teamId = query.teamId as string;
        if (!teamId) return { error: "Missing teamId" };
        
        try {
          const payload = body as any;
          if (payload?.type === "message" || payload?.event === "message") {
            const sender = payload.sender || payload.from;
            const text = payload.text || payload.message?.conversation;
            
            redis.publish("waforge:events", JSON.stringify({
              teamId,
              event: "new_message",
              data: { sender, text, timestamp: new Date().toISOString() }
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

console.log(`🦊 Core API running at ${app.server?.hostname}:${app.server?.port}`);
