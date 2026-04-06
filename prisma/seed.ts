import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  console.log("Seeding database...");

  // Workspace
  const ws = await prisma.workspace.create({
    data: { name: "REDKING Marketing", emoji: "🚀" },
  });

  // Owner user
  const hash = await bcrypt.hash("admin123", 10);
  const owner = await prisma.user.create({
    data: { name: "Andrey", email: "andrey@redking.co", password: hash, role: "owner", avatarColor: "#3b82f6", workspaceId: ws.id },
  });

  // Team members (original)
  const teamHash = await bcrypt.hash("redking2026", 10);
  const maria = await prisma.user.create({ data: { name: "María", email: "maria@redking.co", password: await bcrypt.hash("maria123", 10), role: "editor", avatarColor: "#a855f7", workspaceId: ws.id } });
  const carlos = await prisma.user.create({ data: { name: "Carlos", email: "carlos@redking.co", password: await bcrypt.hash("carlos123", 10), role: "editor", avatarColor: "#22c55e", workspaceId: ws.id } });
  const ana = await prisma.user.create({ data: { name: "Ana", email: "ana@redking.co", password: await bcrypt.hash("ana123", 10), role: "editor", avatarColor: "#ec4899", workspaceId: ws.id } });

  // Extended team
  await prisma.user.createMany({
    data: [
      { name: "Fabian", email: "fabian@redking.co", password: teamHash, role: "editor", avatarColor: "#f97316", workspaceId: ws.id },
      { name: "Manuel", email: "manuel@redking.co", password: teamHash, role: "editor", avatarColor: "#14b8a6", workspaceId: ws.id },
      { name: "Valeria", email: "valeria@redking.co", password: teamHash, role: "editor", avatarColor: "#8b5cf6", workspaceId: ws.id },
      { name: "Julian", email: "julian@redking.co", password: teamHash, role: "editor", avatarColor: "#ef4444", workspaceId: ws.id },
      { name: "Daniel", email: "daniel@redking.co", password: teamHash, role: "editor", avatarColor: "#06b6d4", workspaceId: ws.id },
      { name: "David", email: "david@redking.co", password: teamHash, role: "editor", avatarColor: "#d946ef", workspaceId: ws.id },
      { name: "Karen", email: "karen@redking.co", password: teamHash, role: "editor", avatarColor: "#84cc16", workspaceId: ws.id },
      { name: "Alejandra", email: "alejandra@redking.co", password: teamHash, role: "editor", avatarColor: "#f43f5e", workspaceId: ws.id },
      { name: "Denis", email: "denis@redking.co", password: teamHash, role: "editor", avatarColor: "#0ea5e9", workspaceId: ws.id },
      { name: "Karol", email: "karol@redking.co", password: teamHash, role: "editor", avatarColor: "#eab308", workspaceId: ws.id },
      { name: "Tatiana", email: "tatiana@redking.co", password: teamHash, role: "editor", avatarColor: "#6366f1", workspaceId: ws.id },
    ],
  });

  // Tags
  await prisma.tag.createMany({
    data: [
      { name: "Urgente", color: "#ef4444", workspaceId: ws.id },
      { name: "Bloqueada", color: "#f97316", workspaceId: ws.id },
      { name: "Nuevo producto", color: "#22c55e", workspaceId: ws.id },
    ],
  });

  // Board 1: Campañas Facebook
  const b1 = await prisma.board.create({
    data: {
      name: "Campañas Facebook", emoji: "📣", workspaceId: ws.id, position: 0,
      columns: {
        create: [
          { name: "Por hacer", color: "#6b7280", position: 0 },
          { name: "En proceso", color: "#3b82f6", position: 1 },
          { name: "En revisión", color: "#f59e0b", position: 2 },
          { name: "Completado", color: "#22c55e", position: 3 },
        ],
      },
    },
    include: { columns: true },
  });

  // Board 2: Creativos
  await prisma.board.create({
    data: {
      name: "Creativos", emoji: "🎨", workspaceId: ws.id, position: 1,
      columns: {
        create: [
          { name: "Por hacer", color: "#6b7280", position: 0 },
          { name: "En proceso", color: "#3b82f6", position: 1 },
          { name: "En revisión", color: "#f59e0b", position: 2 },
          { name: "Completado", color: "#22c55e", position: 3 },
        ],
      },
    },
  });

  // Board 3: Contenido TikTok
  await prisma.board.create({
    data: {
      name: "Contenido TikTok", emoji: "🎬", workspaceId: ws.id, position: 2,
      columns: {
        create: [
          { name: "Por hacer", color: "#6b7280", position: 0 },
          { name: "En proceso", color: "#3b82f6", position: 1 },
          { name: "En revisión", color: "#f59e0b", position: 2 },
          { name: "Completado", color: "#22c55e", position: 3 },
        ],
      },
    },
  });

  // Tasks for Board 1
  const cols = b1.columns;
  const porHacer = cols.find((c) => c.name === "Por hacer")!;
  const enProceso = cols.find((c) => c.name === "En proceso")!;
  const enRevision = cols.find((c) => c.name === "En revisión")!;
  const completado = cols.find((c) => c.name === "Completado")!;

  await prisma.task.createMany({
    data: [
      { title: "Campaña Conversión MedSock", status: "en_proceso", priority: "alta", store: "MedSock", campaignType: "Conversión", assigneeId: owner.id, boardId: b1.id, columnId: enProceso.id, position: 0, dueDate: new Date("2026-04-10") },
      { title: "Diseñar creativos Tendearte", status: "por_hacer", priority: "media", store: "Tendearte", campaignType: "Tráfico", assigneeId: maria.id, boardId: b1.id, columnId: porHacer.id, position: 1, dueDate: new Date("2026-04-15") },
      { title: "Setup pixel FloraCare", status: "por_hacer", priority: "urgente", store: "FloraCare", campaignType: "Conversión", assigneeId: carlos.id, boardId: b1.id, columnId: porHacer.id, position: 2, dueDate: new Date("2026-04-05") },
      { title: "Copies A/B WildropShop", status: "en_revision", priority: "alta", store: "WildropShop", campaignType: "Remarketing", assigneeId: carlos.id, boardId: b1.id, columnId: enRevision.id, position: 3, dueDate: new Date("2026-04-08") },
      { title: "Aprobar creativos video", status: "en_revision", priority: "media", store: "MedSock", campaignType: "TOF", assigneeId: ana.id, boardId: b1.id, columnId: enRevision.id, position: 4, dueDate: new Date("2026-04-12") },
      { title: "Lanzar campaña Rojucol", status: "por_hacer", priority: "alta", store: "Rojucol", campaignType: "Conversión", assigneeId: owner.id, boardId: b1.id, columnId: porHacer.id, position: 5, dueDate: new Date("2026-04-20") },
      { title: "Analizar métricas Q1", status: "completado", priority: "baja", store: "MedSock", campaignType: "BOF", assigneeId: owner.id, boardId: b1.id, columnId: completado.id, position: 6, dueDate: new Date("2026-03-30") },
      { title: "Segmentar audiencia Monklic", status: "en_proceso", priority: "media", store: "Monklic", campaignType: "Lookalike", assigneeId: maria.id, boardId: b1.id, columnId: enProceso.id, position: 7, dueDate: new Date("2026-04-18") },
      { title: "Brief campaña Día de la Madre", status: "por_hacer", priority: "urgente", store: "Tendearte", campaignType: "Conversión", assigneeId: ana.id, boardId: b1.id, columnId: porHacer.id, position: 8, dueDate: new Date("2026-04-25") },
      { title: "Reporte semanal clientes", status: "completado", priority: "baja", store: "WildropShop", campaignType: "TOF", assigneeId: carlos.id, boardId: b1.id, columnId: completado.id, position: 9, dueDate: new Date("2026-03-28") },
    ],
  });

  // Pages
  await prisma.page.create({
    data: {
      title: "SOPs del equipo", emoji: "📋", workspaceId: ws.id, position: 0,
      blocks: {
        create: [
          { type: "h1", content: "SOPs del equipo", position: 0 },
          { type: "text", content: "Documentación de procesos internos del equipo de marketing.", position: 1 },
          { type: "h2", content: "Proceso de lanzamiento de campaña", position: 2 },
          { type: "numbered-list", content: "Definir objetivo y KPIs", position: 3 },
          { type: "numbered-list", content: "Crear brief creativo", position: 4 },
          { type: "numbered-list", content: "Diseñar creativos y copies", position: 5 },
          { type: "numbered-list", content: "Configurar campaña en Ads Manager", position: 6 },
          { type: "numbered-list", content: "Revisar y lanzar", position: 7 },
        ],
      },
    },
  });

  await prisma.page.create({
    data: {
      title: "Notas de reunión", emoji: "📝", workspaceId: ws.id, position: 1,
      blocks: {
        create: [
          { type: "h1", content: "Notas de reunión semanal", position: 0 },
          { type: "text", content: "Resumen de la reunión del equipo.", position: 1 },
          { type: "todo", content: "Revisar métricas de la semana", position: 2, properties: { checked: false } },
          { type: "todo", content: "Asignar tareas pendientes", position: 3, properties: { checked: true } },
          { type: "todo", content: "Preparar brief para nueva campaña", position: 4, properties: { checked: false } },
        ],
      },
    },
  });

  await prisma.page.create({
    data: {
      title: "Guía de marca", emoji: "🎨", workspaceId: ws.id, position: 2,
      blocks: {
        create: [
          { type: "h1", content: "Guía de marca", position: 0 },
          { type: "text", content: "Lineamientos de diseño y comunicación para todas las tiendas.", position: 1 },
          { type: "h2", content: "Colores principales", position: 2 },
          { type: "text", content: "Azul (#3b82f6), Verde (#22c55e), Gris (#6b7280)", position: 3 },
          { type: "h2", content: "Tipografía", position: 4 },
          { type: "text", content: "Geist Sans para UI, Geist Mono para código y datos.", position: 5 },
        ],
      },
    },
  });

  // Chat messages
  await prisma.chatMessage.createMany({
    data: [
      { text: "¡Bienvenidos al Marketing Hub! 🚀", channelType: "general", channelId: "general", senderId: owner.id },
      { text: "Todo listo para la campaña de Día de la Madre", channelType: "general", channelId: "general", senderId: maria.id },
      { text: "Los creativos del carrusel están en revisión", channelType: "board", channelId: b1.id, senderId: ana.id },
    ],
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
