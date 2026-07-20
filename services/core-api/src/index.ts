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
  
  .listen(3000);

console.log(`🦊 Core API running at ${app.server?.hostname}:${app.server?.port}`);
