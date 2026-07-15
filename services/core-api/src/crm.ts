/**
 * CRM Routes — Pipeline Stages, Contact Stage Management, Notes
 * Mounted under /core/crm by the main Elysia app
 */
import { Elysia, t } from 'elysia';
import { PrismaClient } from '@waforge/database';

const prisma = new PrismaClient();

/**
 * Middleware: extracts tenantId from JWT payload injected by parent app's derive.
 * Expects `activeTenantId` in the context (set by the auth derive in index.ts).
 */
export const crmRoutes = new Elysia({ prefix: '/crm' })

  // ── Pipeline Stages CRUD ────────────────────────────────────────────────────

  .get('/pipeline-stages', async ({ query }) => {
    const teamId = query.teamId as string;
    if (!teamId) return { error: 'Missing teamId' };

    const stages = await prisma.pipelineStage.findMany({
      where: { teamId },
      orderBy: { position: 'asc' },
      include: { _count: { select: { contacts: true } } }
    });
    return { data: stages };
  })

  .post('/pipeline-stages', async ({ body }) => {
    const stage = await prisma.pipelineStage.create({
      data: {
        teamId: body.teamId,
        name: body.name,
        color: body.color || '#6366f1',
        position: body.position ?? 0,
      }
    });
    return { data: stage };
  }, {
    body: t.Object({
      teamId: t.String(),
      name: t.String(),
      color: t.Optional(t.String()),
      position: t.Optional(t.Number()),
    })
  })

  .patch('/pipeline-stages/:id', async ({ params, body }) => {
    const stage = await prisma.pipelineStage.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.color && { color: body.color }),
        ...(body.position !== undefined && { position: body.position }),
      }
    });
    return { data: stage };
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      color: t.Optional(t.String()),
      position: t.Optional(t.Number()),
    })
  })

  .delete('/pipeline-stages/:id', async ({ params }) => {
    // Contacts in this stage get set to null (unassigned) thanks to onDelete: SetNull
    await prisma.pipelineStage.delete({ where: { id: params.id } });
    return { success: true };
  })

  // ── Pipeline Kanban Data (contacts grouped by stage) ────────────────────────

  .get('/pipeline', async ({ query }) => {
    const teamId = query.teamId as string;
    if (!teamId) return { error: 'Missing teamId' };

    const stages = await prisma.pipelineStage.findMany({
      where: { teamId },
      orderBy: { position: 'asc' },
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
            labels: true,
            pipelineStageId: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
        _count: { select: { contacts: true } }
      }
    });

    // Also get unassigned contacts (pipelineStageId = null)
    const unassigned = await prisma.contact.findMany({
      where: { teamId, pipelineStageId: null },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        labels: true,
        pipelineStageId: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return {
      data: {
        stages,
        unassigned: { id: '__unassigned', name: 'Inbox', color: '#94a3b8', contacts: unassigned, _count: { contacts: unassigned.length } },
      }
    };
  })

  // ── Move Contact to a different Pipeline Stage ──────────────────────────────

  .patch('/contacts/:id/stage', async ({ params, body }) => {
    const previousContact = await prisma.contact.findUnique({
      where: { id: params.id },
      select: { pipelineStageId: true }
    });

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: { pipelineStageId: body.stageId || null }
    });

    // Auto-generate a timeline note for the stage change
    const fromStage = previousContact?.pipelineStageId
      ? (await prisma.pipelineStage.findUnique({ where: { id: previousContact.pipelineStageId } }))?.name || 'Sconosciuto'
      : 'Inbox';
    const toStage = body.stageId
      ? (await prisma.pipelineStage.findUnique({ where: { id: body.stageId } }))?.name || 'Sconosciuto'
      : 'Inbox';

    await prisma.contactNote.create({
      data: {
        contactId: params.id,
        type: 'stage_change',
        content: `Spostato da "${fromStage}" a "${toStage}"`,
        metadata: { from: previousContact?.pipelineStageId, to: body.stageId },
      }
    });

    return { data: contact };
  }, {
    body: t.Object({
      stageId: t.Union([t.String(), t.Null()]),
    })
  })

  // ── Contact Notes (Activity Timeline) ───────────────────────────────────────

  .get('/contacts/:id/notes', async ({ params, query }) => {
    const limit = Number(query.limit) || 50;
    const notes = await prisma.contactNote.findMany({
      where: { contactId: params.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return { data: notes };
  })

  .post('/contacts/:id/notes', async ({ params, body }) => {
    const note = await prisma.contactNote.create({
      data: {
        contactId: params.id,
        authorId: body.authorId || null,
        type: body.type || 'note',
        content: body.content,
        metadata: body.metadata || null,
      }
    });
    return { data: note };
  }, {
    body: t.Object({
      content: t.String(),
      type: t.Optional(t.String()),
      authorId: t.Optional(t.String()),
      metadata: t.Optional(t.Any()),
    })
  })

  // ── Contact Detail (full profile for drawer/page) ───────────────────────────

  .get('/contacts/:id', async ({ params }) => {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        pipelineStage: true,
        groups: true,
        contactNotes: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: {
          select: {
            messages: true,
            chatHistory: true,
            waConversations: true,
          }
        }
      }
    });
    if (!contact) return { error: 'Contact not found' };
    return { data: contact };
  })

  // ── CRM Analytics ───────────────────────────────────────────────────────────

  .get('/analytics', async ({ query }) => {
    const teamId = query.teamId as string;
    if (!teamId) return { error: 'Missing teamId' };

    const [totalContacts, contactsByStage, contactsBySource, recentContacts] = await Promise.all([
      // Total
      prisma.contact.count({ where: { teamId } }),
      // By pipeline stage
      prisma.pipelineStage.findMany({
        where: { teamId },
        orderBy: { position: 'asc' },
        include: { _count: { select: { contacts: true } } }
      }),
      // By source
      prisma.contact.groupBy({
        by: ['source'],
        where: { teamId },
        _count: true,
      }),
      // Recent (last 30 days)
      prisma.contact.count({
        where: {
          teamId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
    ]);

    const unassigned = await prisma.contact.count({
      where: { teamId, pipelineStageId: null }
    });

    return {
      data: {
        totalContacts,
        recentContacts,
        unassigned,
        byStage: contactsByStage.map(s => ({
          id: s.id,
          name: s.name,
          color: s.color,
          count: s._count.contacts,
        })),
        bySource: contactsBySource.map(s => ({
          source: s.source,
          count: s._count,
        })),
      }
    };
  });
