import type { Task, Board, TeamMember, Column } from "@/types";

export const COLUMNS: Column[] = [
  { id: "por_hacer", title: "Por hacer" },
  { id: "en_proceso", title: "En proceso" },
  { id: "en_revision", title: "En revisión" },
  { id: "completado", title: "Completado" },
];

export const STORES = [
  "MedSock",
  "Tendearte",
  "FloraCare",
  "WildropShop",
  "Rojucol",
  "Monklic",
] as const;

export const CAMPAIGN_TYPES = [
  "Conversión",
  "Tráfico",
  "Remarketing",
  "Lookalike",
  "TOF",
  "BOF",
] as const;

export const PRIORITIES = ["urgente", "alta", "media", "baja"] as const;

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "u1", name: "Andrey", avatar: "A", role: "Media Buyer" },
  { id: "u2", name: "María", avatar: "M", role: "Creative Director" },
  { id: "u3", name: "Carlos", avatar: "C", role: "Copywriter" },
  { id: "u4", name: "Ana", avatar: "AN", role: "Diseñadora" },
];

export const BOARDS: Board[] = [
  {
    id: "b1",
    name: "Campañas Facebook",
    columns: COLUMNS,
    taskIds: ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10"],
  },
  {
    id: "b2",
    name: "Creativos",
    columns: COLUMNS,
    taskIds: [],
  },
  {
    id: "b3",
    name: "Contenido TikTok",
    columns: COLUMNS,
    taskIds: [],
  },
];

export const TASKS: Task[] = [
  {
    id: "t1",
    title: "Crear campaña Conversión - MedSock Calcetines Diabéticos",
    status: "por_hacer",
    priority: "alta",
    store: "MedSock",
    assigneeId: "u1",
    campaignType: "Conversión",
    campaignName: "MedSock_Conv_Calcetines_Mar26",
    adAccount: "Act_MedSock_001",
    dueDate: "2026-04-02",
    urls: ["https://medsock.com/calcetines-diabeticos"],
    attachments: [
      { name: "brief_medsock.pdf", size: "2.4 MB" },
      { name: "referencias_visual.zip", size: "15 MB" },
    ],
    comments: [
      {
        id: "c1",
        authorId: "u2",
        content: "Necesitamos creativos con enfoque médico, no lifestyle",
        createdAt: "2026-03-28T10:30:00",
      },
    ],
    activity: [
      {
        id: "a1",
        authorId: "u1",
        action: "creó la tarea",
        createdAt: "2026-03-27T09:00:00",
      },
    ],
  },
  {
    id: "t2",
    title: "Diseñar creativos carrusel Tendearte - Colección Primavera",
    status: "por_hacer",
    priority: "media",
    store: "Tendearte",
    assigneeId: "u4",
    campaignType: "Tráfico",
    campaignName: "Tendearte_Trafico_Primavera_Mar26",
    adAccount: "Act_Tendearte_001",
    dueDate: "2026-04-05",
    urls: [
      "https://tendearte.com/primavera",
      "https://canva.com/design/tendearte-spring",
    ],
    attachments: [{ name: "moodboard.png", size: "4.1 MB" }],
    comments: [],
    activity: [
      {
        id: "a2",
        authorId: "u4",
        action: "creó la tarea",
        createdAt: "2026-03-26T14:00:00",
      },
    ],
  },
  {
    id: "t3",
    title: "Configurar Lookalike ATC - FloraCare Suculentas",
    status: "en_proceso",
    priority: "alta",
    store: "FloraCare",
    assigneeId: "u1",
    campaignType: "Lookalike",
    campaignName: "FloraCare_LAL_ATC_Suculentas",
    adAccount: "Act_FloraCare_001",
    dueDate: "2026-03-31",
    urls: ["https://business.facebook.com/adsmanager"],
    attachments: [],
    comments: [
      {
        id: "c2",
        authorId: "u1",
        content: "Audiencia seed de 1% lista, esperando aprobación del pixel",
        createdAt: "2026-03-29T11:00:00",
      },
    ],
    activity: [
      {
        id: "a3",
        authorId: "u1",
        action: "creó la tarea",
        createdAt: "2026-03-25T08:00:00",
      },
      {
        id: "a4",
        authorId: "u1",
        action: "movió a En proceso",
        createdAt: "2026-03-28T09:00:00",
      },
    ],
  },
  {
    id: "t4",
    title: "Escribir copies A/B para Remarketing WildropShop",
    status: "en_proceso",
    priority: "urgente",
    store: "WildropShop",
    assigneeId: "u3",
    campaignType: "Remarketing",
    campaignName: "WildropShop_RMK_Abandono_Mar26",
    adAccount: "Act_WildropShop_001",
    dueDate: "2026-03-30",
    urls: [
      "https://docs.google.com/document/d/wildropshop-copies",
      "https://wildropshop.com/checkout",
    ],
    attachments: [{ name: "copies_v1.docx", size: "340 KB" }],
    comments: [
      {
        id: "c3",
        authorId: "u2",
        content: "Urgente: el ROAS bajó 30% esta semana, necesitamos copies frescos",
        createdAt: "2026-03-29T16:00:00",
      },
      {
        id: "c4",
        authorId: "u3",
        content: "Tengo 3 variantes listas, subo en 2 horas",
        createdAt: "2026-03-29T17:30:00",
      },
    ],
    activity: [
      {
        id: "a5",
        authorId: "u3",
        action: "creó la tarea",
        createdAt: "2026-03-28T10:00:00",
      },
      {
        id: "a6",
        authorId: "u3",
        action: "movió a En proceso",
        createdAt: "2026-03-29T08:00:00",
      },
    ],
  },
  {
    id: "t5",
    title: "Revisar métricas campaña TOF Rojucol - Joyería Artesanal",
    status: "en_revision",
    priority: "media",
    store: "Rojucol",
    assigneeId: "u1",
    campaignType: "TOF",
    campaignName: "Rojucol_TOF_Joyeria_Feb26",
    adAccount: "Act_Rojucol_001",
    dueDate: "2026-04-01",
    urls: ["https://business.facebook.com/adsmanager/reports"],
    attachments: [
      { name: "reporte_febrero.xlsx", size: "1.8 MB" },
      { name: "dashboard_screenshot.png", size: "890 KB" },
    ],
    comments: [
      {
        id: "c5",
        authorId: "u1",
        content: "CPA bajó a $4.20, excelente rendimiento en el ad set 3",
        createdAt: "2026-03-29T14:00:00",
      },
    ],
    activity: [
      {
        id: "a7",
        authorId: "u1",
        action: "creó la tarea",
        createdAt: "2026-03-20T09:00:00",
      },
      {
        id: "a8",
        authorId: "u1",
        action: "movió a En revisión",
        createdAt: "2026-03-29T13:00:00",
      },
    ],
  },
  {
    id: "t6",
    title: "Aprobar creativos video Monklic - Accesorios Tech",
    status: "en_revision",
    priority: "alta",
    store: "Monklic",
    assigneeId: "u2",
    campaignType: "Conversión",
    campaignName: "Monklic_Conv_AccTech_Mar26",
    adAccount: "Act_Monklic_001",
    dueDate: "2026-03-31",
    urls: [
      "https://drive.google.com/drive/monklic-videos",
      "https://monklic.com/accesorios-tech",
    ],
    attachments: [
      { name: "video_hook_v1.mp4", size: "28 MB" },
      { name: "video_hook_v2.mp4", size: "32 MB" },
      { name: "thumbnail_opciones.psd", size: "18 MB" },
    ],
    comments: [
      {
        id: "c6",
        authorId: "u4",
        content: "Subí 2 versiones del hook, la v2 tiene mejor ritmo",
        createdAt: "2026-03-29T15:00:00",
      },
      {
        id: "c7",
        authorId: "u2",
        content: "Me gusta la v2 pero ajusten el CTA final",
        createdAt: "2026-03-29T16:30:00",
      },
    ],
    activity: [
      {
        id: "a9",
        authorId: "u4",
        action: "creó la tarea",
        createdAt: "2026-03-24T10:00:00",
      },
      {
        id: "a10",
        authorId: "u2",
        action: "movió a En revisión",
        createdAt: "2026-03-29T14:30:00",
      },
    ],
  },
  {
    id: "t7",
    title: "Campaña BOF FloraCare - Kits de Regalo completada",
    status: "completado",
    priority: "media",
    store: "FloraCare",
    assigneeId: "u1",
    campaignType: "BOF",
    campaignName: "FloraCare_BOF_Kits_Feb26",
    adAccount: "Act_FloraCare_001",
    dueDate: "2026-03-25",
    urls: ["https://floracare.com/kits-regalo"],
    attachments: [
      { name: "reporte_final.pdf", size: "3.2 MB" },
    ],
    comments: [
      {
        id: "c8",
        authorId: "u1",
        content: "ROAS 4.8x, superamos el objetivo. Cerrada.",
        createdAt: "2026-03-25T18:00:00",
      },
    ],
    activity: [
      {
        id: "a11",
        authorId: "u1",
        action: "creó la tarea",
        createdAt: "2026-03-10T09:00:00",
      },
      {
        id: "a12",
        authorId: "u1",
        action: "movió a Completado",
        createdAt: "2026-03-25T18:00:00",
      },
    ],
  },
  {
    id: "t8",
    title: "Landing page Tendearte - Campaña Día de la Madre",
    status: "completado",
    priority: "alta",
    store: "Tendearte",
    assigneeId: "u4",
    campaignType: "Conversión",
    campaignName: "Tendearte_Conv_DiaMadre_Mar26",
    adAccount: "Act_Tendearte_001",
    dueDate: "2026-03-28",
    urls: [
      "https://tendearte.com/dia-de-la-madre",
      "https://figma.com/tendearte-landing",
    ],
    attachments: [
      { name: "landing_final.fig", size: "12 MB" },
      { name: "assets_exportados.zip", size: "45 MB" },
    ],
    comments: [],
    activity: [
      {
        id: "a13",
        authorId: "u4",
        action: "creó la tarea",
        createdAt: "2026-03-15T09:00:00",
      },
      {
        id: "a14",
        authorId: "u4",
        action: "movió a Completado",
        createdAt: "2026-03-28T16:00:00",
      },
    ],
  },
  {
    id: "t9",
    title: "Setup pixel y eventos - MedSock nueva tienda",
    status: "por_hacer",
    priority: "urgente",
    store: "MedSock",
    assigneeId: "u1",
    campaignType: "Tráfico",
    campaignName: "MedSock_Setup_Pixel_Mar26",
    adAccount: "Act_MedSock_001",
    dueDate: "2026-04-01",
    urls: ["https://business.facebook.com/events_manager"],
    attachments: [],
    comments: [
      {
        id: "c9",
        authorId: "u1",
        content: "Prioridad máxima: sin pixel no podemos lanzar ninguna campaña",
        createdAt: "2026-03-29T09:00:00",
      },
    ],
    activity: [
      {
        id: "a15",
        authorId: "u1",
        action: "creó la tarea",
        createdAt: "2026-03-29T08:30:00",
      },
    ],
  },
  {
    id: "t10",
    title: "Escalar campaña Remarketing Rojucol - Público caliente",
    status: "en_proceso",
    priority: "media",
    store: "Rojucol",
    assigneeId: "u1",
    campaignType: "Remarketing",
    campaignName: "Rojucol_RMK_PubCaliente_Mar26",
    adAccount: "Act_Rojucol_001",
    dueDate: "2026-04-03",
    urls: ["https://business.facebook.com/adsmanager"],
    attachments: [{ name: "audiencias_calientes.csv", size: "120 KB" }],
    comments: [],
    activity: [
      {
        id: "a16",
        authorId: "u1",
        action: "creó la tarea",
        createdAt: "2026-03-27T11:00:00",
      },
      {
        id: "a17",
        authorId: "u1",
        action: "movió a En proceso",
        createdAt: "2026-03-29T10:00:00",
      },
    ],
  },
];
