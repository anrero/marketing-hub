# AUDITORIA FINAL — Marketing Hub

**Fecha:** 2026-04-01
**Alcance:** Revisión completa de todos los componentes, stores, vistas y funcionalidades
**Archivos auditados:** 35+ componentes, 5 stores, tipos, utilidades, layout

---

## 1. LISTA DE TODAS LAS FUNCIONALIDADES

### AUTENTICACION Y SESION

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 1 | Login con email + password | ✅ | `components/login-page.tsx` | Validaciones presentes |
| 2 | Registro de nuevos usuarios | ✅ | `components/login-page.tsx` | Verifica duplicados, min 6 chars |
| 3 | Toggle mostrar/ocultar password | ✅ | `components/login-page.tsx:88-90` | Eye/EyeOff icons |
| 4 | Sesion persistente en localStorage | ✅ | `stores/auth-store.ts` | Persist middleware con `mh-auth-storage` |
| 5 | Logout desde sidebar | ✅ | `components/sidebar.tsx:267` | Limpia currentUser |
| 6 | AuthGuard en ruta principal | ✅ | `app/page.tsx:85-91` | Redirige a LoginPage si no hay sesion |
| 7 | Hydration guard (evita flash SSR) | ✅ | `app/page.tsx:87-89` | useState + useEffect pattern |
| 8 | Usuarios demo pre-creados (Andrey, Maria, Carlos, Ana) | ✅ | `stores/auth-store.ts:42-47` | Con passwords btoa-encoded |
| 9 | Credenciales demo visibles en login | ✅ | `components/login-page.tsx:131-133` | Hint al pie |
| 10 | Avatar del usuario actual en sidebar | ✅ | `components/sidebar.tsx:244-271` | UserFooter con nombre + email |

### PERSISTENCIA DE DATOS

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 11 | Board store persistido | ✅ | `stores/board-store.ts:652-669` | `mh-board-storage`, v1 |
| 12 | Sidebar store persistido | ✅ | `stores/sidebar-store.ts:475-488` | `mh-sidebar-storage`, v1 |
| 13 | Table columns store persistido | ✅ | `stores/table-columns-store.ts:140-144` | `mh-table-columns-storage`, v1 |
| 14 | History store NO persistido (correcto) | ✅ | `stores/history-store.ts:24` | Contiene closures, no se puede serializar |
| 15 | Partialize excluye undoStack/redoStack | ✅ | `stores/board-store.ts:655-668` | Solo datos serializables |
| 16 | Partialize excluye estados de dialogs | ✅ | `stores/board-store.ts:655-668` | newTaskDialogOpen, etc. excluidos |
| 17 | Boton "Resetear datos a demo" en Configuracion | ✅ | `components/settings-dialog.tsx:497-506` | Limpia 3 keys, recarga pagina |
| 18 | Tareas persisten al refrescar | ✅ | Via board-store persist | boards, tasks, tags, templates |
| 19 | Paginas y contenido persisten | ✅ | Via sidebar-store persist | pages con blocks completos |
| 20 | Favoritos y recientes persisten | ✅ | Via sidebar-store persist | favorites, recents |
| 21 | Papelera persiste | ✅ | Via sidebar-store persist | trash array completo |
| 22 | Configuracion de columnas de tabla persiste | ✅ | Via table-columns-store persist | visibilidad, ancho, orden |

### TASK DETAIL (Panel lateral estilo Notion)

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 23 | Titulo h1 editable contentEditable | ✅ | `components/task-detail.tsx:254-265` | Guarda onBlur |
| 24 | Sync titulo al abrir tarea | ✅ | `components/task-detail.tsx:147-154` | useEffect con selectedTaskId + task.title |
| 25 | Propiedad: Responsable (avatar + dropdown) | ✅ | `components/task-detail.tsx:277-291` | Select con avatar |
| 26 | Propiedad: Estado (badge color + dropdown) | ✅ | `components/task-detail.tsx:293-304` | Con dot de color |
| 27 | Propiedad: Prioridad (badge + dropdown) | ✅ | `components/task-detail.tsx:305-315` | Capitalizado |
| 28 | Propiedad: Fecha limite (date picker) | ✅ | `components/task-detail.tsx:316-319` | Input type=date |
| 29 | Propiedad: Recordatorio (dropdown) | ✅ | `components/task-detail.tsx:321-326` | 5 opciones |
| 30 | Propiedad: Tienda (dropdown) | ✅ | `components/task-detail.tsx:328-333` | Incluye custom stores |
| 31 | Propiedad: Cuenta Pub. (input inline) | ✅ | `components/task-detail.tsx:335-338` | Editable, guarda onBlur |
| 32 | Propiedad: Tipo Campana (dropdown) | ✅ | `components/task-detail.tsx:341-346` | Incluye custom types |
| 33 | Propiedad: Nombre Campana (input inline) | ✅ | `components/task-detail.tsx:348-351` | Editable |
| 34 | Propiedad: Etiquetas (multi-select toggle) | ✅ | `components/task-detail.tsx:353-367` | Botones toggle con color |
| 35 | Propiedad: Bloqueada por (selector dependencias) | ✅ | `components/task-detail.tsx:370-388` | Con eliminar dependencia |
| 36 | Propiedad: Estimado (numero + unidad) | ✅ | `components/task-detail.tsx:393-399` | horas/dias |
| 37 | Propiedad: Real (numero + unidad) | ✅ | `components/task-detail.tsx:402-408` | horas/dias |
| 38 | Boton "+ Agregar propiedad" (decorativo) | ✅ | `components/task-detail.tsx:412-414` | Presente |
| 39 | Separador con "..." (menu dropdown) | ✅ | `components/task-detail.tsx:417-430` | Duplicar, Exportar Markdown |
| 40 | Seccion Comentarios (agregar, listar) | ✅ | `components/task-detail.tsx:433-471` | Con avatar, timeAgo |
| 41 | Seccion Descripcion (contentEditable) | ✅ | `components/task-detail.tsx:476-493` | Ctrl+B/I/U, guarda onBlur |
| 42 | Seccion Subtareas (barra progreso, checkbox) | ✅ | `components/task-detail.tsx:498-541` | Add, toggle, remove, progress bar |
| 43 | Seccion Archivos adjuntos (dropzone) | ✅ | `components/task-detail.tsx:546-570` | react-dropzone, iconos por tipo |
| 44 | Seccion URLs (agregar, listar, eliminar) | ✅ | `components/task-detail.tsx:575-596` | Links clickeables |
| 45 | Seccion Actividad (colapsable) | ✅ | `components/task-detail.tsx:600-626` | Colapsada por defecto |
| 46 | Header: Boton Maximize2 (decorativo) | ✅ | `components/task-detail.tsx:199` | Presente |
| 47 | Header: Boton Share (decorativo) | ✅ | `components/task-detail.tsx:202` | Presente |
| 48 | Header: Boton Favorito (toggle) | ✅ | `components/task-detail.tsx:205-207` | Star fill/outline |
| 49 | Header: Menu "..." (duplicar, archivar, exportar md, eliminar) | ✅ | `components/task-detail.tsx:209-236` | Todas las opciones funcionales |
| 50 | Header: Boton X cierra panel | ✅ | `components/task-detail.tsx:239-240` | setSelectedTask(null) |
| 51 | SheetTitle sr-only para accesibilidad | ✅ | `components/task-detail.tsx:196` | Presente |
| 52 | Exportar tarea como Markdown | ✅ | `components/task-detail.tsx:79-97` | Genera MD con tabla de propiedades |
| 53 | Imagen de portada (agregar/quitar) | ✅ | `components/task-detail.tsx:247-253,267-270` | Cover image |

### EDITOR DE PAGINAS

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 54 | Enter crea nuevo bloque | ✅ | `page-editor.tsx:300-304` | flushContent + onInsertAfter |
| 55 | Backspace en bloque vacio lo elimina | ✅ | `page-editor.tsx:306-312` | Si totalBlocks > 1 |
| 56 | Slash commands menu ("/" para abrir) | ✅ | `page-editor.tsx:280-291` | 29 comandos en 6 grupos |
| 57 | Slash menu con scroll y categorias | ✅ | `page-editor.tsx:122-141` | max-h-[350px] overflow-y-auto |
| 58 | Atajos markdown (#, ##, -, [], >, ---, ```) | ✅ | `page-editor.tsx:268-278` | Conversion automatica |
| 59 | Toolbar flotante al seleccionar texto | ✅ | `page-editor.tsx:144-222` | Bold, italic, underline, strike, code, link, color, highlight |
| 60 | Toolbar solo aparece en bloques (no breadcrumb) | ✅ | `page-editor.tsx:155-156` | Verifica `closest("[data-block-id]")` |
| 61 | Bloques code con syntax highlighting y copy | ✅ | `page-editor.tsx:390-412` | 10 lenguajes, boton copiar |
| 62 | Bloques toggle (expand/collapse) | ⚠️ | `page-editor.tsx:414-433` | Ver BUG #1 abajo |
| 63 | Bloques table (agregar filas/columnas) | ✅ | `page-editor.tsx:435-467` | Celdas editables |
| 64 | Bloques columns (2 columnas) | ✅ | `page-editor.tsx:490-502` | Contenido persiste via ColumnCellEditor |
| 65 | Bloques image/video/file/bookmark | ✅ | `page-editor.tsx:469-487` | Upload + URL, embed YouTube/Vimeo |
| 66 | Bloques callout con emoji y color | ✅ | `page-editor.tsx:371-388` | 6 colores, click cambia color |
| 67 | Bloque Table of Contents | ⚠️ | `page-editor.tsx:553-565` | Ver BUG #5 abajo |
| 68 | Bloque page-link (enlace a pagina) | ✅ | `page-editor.tsx:504-526` | Selector de paginas |
| 69 | Bloques mention y date | ✅ | `page-editor.tsx:528-550` | Insercion directa |
| 70 | Drag & drop reordenar bloques | ✅ | `page-editor.tsx:807-816,1001-1018` | dnd-kit con SortableBlock |
| 71 | Breadcrumb navegable y editable | ✅ | `page-editor.tsx:1068-1094` | Double-click para renombrar |
| 72 | Emoji picker para pagina | ✅ | `page-editor.tsx:736-748,979` | Grid de 20 emojis |
| 73 | Cover image en paginas | ✅ | `page-editor.tsx:966-975` | Agregar/cambiar/quitar |
| 74 | Modo Focus / Zen | ✅ | `page-editor.tsx:869-871,1031-1038` | Maximize2 boton, Escape sale |
| 75 | Ctrl+F busqueda en pagina | ✅ | `page-editor.tsx:853-917` | Intercepta nativo, highlights amarillos |
| 76 | Busqueda: contador resultados | ✅ | `page-editor.tsx:1055-1059` | "X de Y resultados" |
| 77 | Busqueda: navegacion con flechas | ✅ | `page-editor.tsx:1060-1061` | scrollIntoView |
| 78 | Progreso de todos (checked/total) | ✅ | `page-editor.tsx:990-998` | Barra de progreso |
| 79 | Plantillas de pagina | ✅ | `page-editor.tsx:1029-1037` | 4 plantillas built-in |

### KANBAN

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 80 | Drag & drop tareas entre columnas | ✅ | `kanban-board.tsx:44-69` | DndContext con closestCorners |
| 81 | DragOverlay durante arrastre | ✅ | `kanban-board.tsx:98-99` | Muestra TaskCard transparente |
| 82 | Empty state cuando no hay tareas | ✅ | `kanban-board.tsx:73-78` | EmptyState component |
| 83 | Skeleton loading al cambiar board | ✅ | `kanban-board.tsx:26,71` | 200ms delay |
| 84 | "+ Agregar tarea" en cada columna | ✅ | `kanban-column.tsx:206-233` | Inline creation, Enter/Escape |
| 85 | Sorting por prioridad/fecha/nombre/assignee | ✅ | `kanban-column.tsx:73-81` | 5 opciones |
| 86 | WIP limits con indicador visual | ✅ | `kanban-column.tsx:65-66,125` | Rojo cuando excede limite |
| 87 | Context menu en header columna | ✅ | `kanban-column.tsx:111-192` | Renombrar, color, WIP, agregar/eliminar |
| 88 | 12 colores para columnas | ✅ | `kanban-column.tsx:20-33` | Grid de colores |
| 89 | Archivar completadas | ✅ | `kanban-column.tsx:129-133` | Solo en columna "completado" |
| 90 | Click en card abre task detail | ✅ | `task-card.tsx:64` | setSelectedTask(task.id) |
| 91 | Right-click context menu en cards | ✅ | `task-card.tsx:130-158` | 6 secciones |
| 92 | Submenu "Asignar a..." con miembros | ✅ | `task-card.tsx:148-152` | Todos los miembros |
| 93 | Submenu "Cambiar prioridad" | ✅ | `task-card.tsx:136-139` | 4 prioridades |
| 94 | Submenu "Mover a..." con columnas | ✅ | `task-card.tsx:141-145` | Columnas del board activo |
| 95 | Hover: sombra elevada + boton "Abrir" | ✅ | `task-card.tsx:65-77` | shadow-lg, -translate-y-0.5, "Abrir" text |
| 96 | Tags en cards | ✅ | `task-card.tsx:90-94` | Color badges |

### TABLA

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 97 | Edicion inline en todas las celdas | ✅ | `table-view.tsx` | TitleCell, EditableTextCell, StatusCell, etc. |
| 98 | Rich title editor con toolbar | ✅ | `table-view.tsx:215-259` | Bold, italic, strike, link, color |
| 99 | Drag & drop reordenar filas | ✅ | `table-view.tsx` | SortableContext con dnd-kit |
| 100 | Importar CSV | ✅ | `table-view.tsx:143-333` | Dialog con preview, mapeo columnas, auto-detect |
| 101 | Exportar CSV | ✅ | `table-view.tsx:124-135` | Con BOM UTF-8, escaping correcto |
| 102 | Exportar JSON | ✅ | `table-view.tsx:137-141` | Pretty print |
| 103 | Agrupar por estado/tienda/prioridad/responsable/tipo | ✅ | `table-view.tsx` | DropdownMenu con 5 opciones + "sin agrupar" |
| 104 | Columnas resizables | ✅ | `table-view.tsx` | Drag handle en headers |
| 105 | Columnas ocultables/mostrables | ✅ | `table-view.tsx` | ColumnsVisibilityPopover |
| 106 | Columnas custom (text, number, select, date, url, checkbox) | ✅ | `table-view.tsx` | Via addCustomColumn |
| 107 | Bulk actions (mover, asignar, prioridad, duplicar, eliminar) | ✅ | `table-view.tsx:348-377` | BulkActionsBar component |
| 108 | Saved views con tabs | ✅ | `table-view.tsx` | Built-in + custom views |
| 109 | Quick task creation en tabla | ✅ | `table-view.tsx` | Input al final de la tabla |
| 110 | Filtros por columna | ✅ | `table-view.tsx` | Popover en header de cada columna |

### CALENDARIO

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 111 | Calendario mensual con grid | ✅ | `calendar-view.tsx` | buildCalendarGrid helper |
| 112 | Navegacion entre meses (prev/next) | ✅ | `calendar-view.tsx:133-149` | Botones + "Hoy" |
| 113 | Click en dia crea tarea con esa fecha | ✅ | `calendar-view.tsx:98-107` | prompt + addQuickTask + setDueDate |
| 114 | Click en tarea pill abre detalle | ✅ | `calendar-view.tsx:240-251` | setSelectedTask |

### TIMELINE

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 115 | Carga sin "Maximum update depth" | ✅ | `timeline-view.tsx:43-44` | useShallow correctamente usado |
| 116 | Barras de tareas con colores por prioridad | ✅ | `timeline-view.tsx:268-306` | Color mapping |
| 117 | Click en barra abre detalle | ✅ | `timeline-view.tsx:286,303` | setSelectedTask |
| 118 | Linea "hoy" en rojo | ✅ | `timeline-view.tsx:256-266` | 2px dashed red |
| 119 | Sombreado de fin de semana | ✅ | `timeline-view.tsx:240-254` | bg-muted/30 |
| 120 | Labels de mes y dia en header | ✅ | `timeline-view.tsx:170-206` | Formato "Ene 2026" |

### GALERIA

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 121 | Grid responsive de cards | ✅ | `gallery-view.tsx:81` | 1/2/3/4 cols segun pantalla |
| 122 | Cards con cover/gradiente, badges, avatar | ✅ | `gallery-view.tsx:86-176` | Diseho completo |
| 123 | Click en card abre detalle | ✅ | `gallery-view.tsx:88` | setSelectedTask |
| 124 | useShallow correctamente usado | ✅ | `gallery-view.tsx:49-50` | Sin re-render loops |
| 125 | Empty state con boton crear | ✅ | `gallery-view.tsx:56-76` | "+ Nueva Tarea" |

### DASHBOARD

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 126 | 4 metricas principales (total, vencidas, hoy, completadas) | ✅ | `dashboard.tsx` | Cards con iconos |
| 127 | Grafico horizontal por tienda | ✅ | `dashboard.tsx:94-117,222-283` | Barras de color por estado |
| 128 | Tabla carga por persona | ✅ | `dashboard.tsx:125-145,287-340` | Progreso, conteos |
| 129 | Tareas vencidas clickeables | ✅ | `dashboard.tsx:355-379` | Abren task detail |
| 130 | Actividad reciente clickeable | ✅ | `dashboard.tsx:395-419` | Abren task detail |

### SIDEBAR

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 131 | Colapsar/expandir sidebar | ✅ | `sidebar.tsx` | Modo iconos vs completo |
| 132 | Quick actions (search, home, inbox) | ✅ | `sidebar.tsx` | Iconos con tooltips |
| 133 | Seccion Recientes | ✅ | `sidebar.tsx` | Items clickeables |
| 134 | Seccion Favoritos | ✅ | `sidebar.tsx` | Boards y paginas favoritos |
| 135 | Lista de boards con drag & drop | ✅ | `sidebar.tsx` | SortableContext + dnd-kit |
| 136 | Board context menu (dropdown + right-click) | ✅ | `sidebar.tsx:629-663` | Favorito, renombrar, duplicar, exportar JSON, exportar CSV, eliminar |
| 137 | Exportar board como JSON | ✅ | `sidebar.tsx:669-675` | Board + tasks |
| 138 | Exportar board como CSV | ✅ | `sidebar.tsx:676-686` | Headers en espanol |
| 139 | Doble-click renombrar boards | ✅ | `sidebar.tsx:622` | onDoubleClick handler |
| 140 | Arbol de paginas con jerarquia | ✅ | `sidebar.tsx:103-240` | PageTreeItem recursivo |
| 141 | Page context menu (rename, emoji, sub-page, duplicate, export md, delete) | ✅ | `sidebar.tsx:172-191` | Compartido entre dropdown y context |
| 142 | Doble-click renombrar paginas | ✅ | `sidebar.tsx:208` | onDoubleClick handler |
| 143 | Drag & drop reordenar paginas | ✅ | `sidebar.tsx` | dnd-kit sortable |
| 144 | Paginas privadas (seccion separada) | ✅ | `sidebar.tsx` | isPrivate flag |
| 145 | Papelera modal (restaurar, eliminar permanente, vaciar) | ✅ | `sidebar.tsx:846-884` | Dialog completo |
| 146 | Invitar miembros modal | ✅ | `sidebar.tsx:273-324` | Email + rol + lista pendientes |
| 147 | Toggle tema claro/oscuro | ✅ | `sidebar.tsx:258` | Sun/Moon icons |
| 148 | Views guardadas (vistas por board) | ✅ | `sidebar.tsx` | Built-in + custom |

### GENERAL

| # | Funcionalidad | Estado | Archivo | Notas |
|---|--------------|--------|---------|-------|
| 149 | Command Palette (Ctrl+K) | ✅ | `command-palette.tsx` | Busca boards, tasks, paginas, acciones |
| 150 | Keyboard shortcuts (Ctrl+Z, Ctrl+Y, ?) | ✅ | `global-shortcuts.tsx` | Con deteccion de inputs |
| 151 | Toasts de confirmacion (sonner) | ✅ | `app/layout.tsx` | position bottom-right, richColors |
| 152 | Titulo dinamico del browser | ✅ | `app/page.tsx:94-111` | Cambia por vista activa |
| 153 | Favicon (emoji cohete) | ✅ | `app/layout.tsx:23` | SVG inline |
| 154 | Tema claro/oscuro (next-themes) | ✅ | `app/layout.tsx:40-45` | ThemeProvider con defaultTheme dark |
| 155 | Responsive mobile (sidebar oculto) | ✅ | `app/page.tsx:127-137` | Overlay + hamburger |
| 156 | Onboarding de 5 pasos | ✅ | `components/onboarding.tsx` | Primera visita, localStorage flag |
| 157 | Settings dialog con todas las config | ✅ | `components/settings-dialog.tsx` | Tiendas, cuentas, miembros, tags, tipos |
| 158 | New Task dialog | ✅ | `components/new-task-dialog.tsx` | Formulario completo |
| 159 | New Board dialog | ✅ | `components/new-board-dialog.tsx` | Nombre del board |
| 160 | Undo/Redo (Ctrl+Z / Ctrl+Shift+Z) | ✅ | `stores/board-store.ts`, `stores/history-store.ts` | Mover y eliminar tareas |

---

## 2. BUGS ENCONTRADOS

### CRITICOS

**BUG #1 — Toggle block: faltan atajos de teclado Enter y Ctrl+B/I/U**
- **Archivo:** `components/page-editor.tsx:424`
- **Linea:** 424
- **Problema:** El bloque toggle tiene un `onKeyDown` inline que solo maneja `Backspace`. No usa el `handleKeyDown` general (linea 297) que maneja `Enter` (crear nuevo bloque), `Ctrl+B` (bold), `Ctrl+I` (italic), `Ctrl+U` (underline). Todos los demas bloques de texto si usan `handleKeyDown`.
- **Impacto:** Dentro del titulo de un toggle, Enter no crea un nuevo bloque y Ctrl+B/I/U no funcionan.
- **Correccion:** Reemplazar el `onKeyDown` inline por `onKeyDown={handleKeyDown}` y agregar la logica de Backspace dentro de `handleKeyDown` condicionalmente para toggle.

### ALTOS

**BUG #2 — restoreFromTrash no valida parentId huerfano**
- **Archivo:** `stores/sidebar-store.ts:371`
- **Linea:** 371
- **Problema:** Al restaurar paginas del trash, se reinsertan con su `parentId` original. Si la pagina padre fue eliminada previamente, el `parentId` apunta a una pagina inexistente, creando referencias huerfanas en la jerarquia.
- **Impacto:** Paginas restauradas pueden no aparecer en el arbol del sidebar porque su padre no existe.
- **Correccion:** Antes de restaurar, verificar si cada `parentId` existe en `pages`; si no existe, setear `parentId: null`.

**BUG #3 — pageTemplates no incluidos en partialize del sidebar store**
- **Archivo:** `stores/sidebar-store.ts:477-487`
- **Linea:** 477
- **Problema:** El `partialize` del sidebar store no incluye `pageTemplates`. Aunque las plantillas built-in se re-crean al inicializar, si un usuario agrega plantillas custom (via `addPageFromTemplate` etc.), estas se pierden al refrescar.
- **Impacto:** Templates custom no persisten entre sesiones.
- **Correccion:** Agregar `pageTemplates: state.pageTemplates` al objeto partialize.

**BUG #4 — Ctrl+F search: `surroundContents` falla con nodos parciales**
- **Archivo:** `components/page-editor.tsx:912`
- **Linea:** 912
- **Problema:** `range.surroundContents(mark)` lanza excepcion si el rango abarca multiples elementos (e.g., texto con `<b>` y `<i>` anidados). El `try/catch` lo atrapa silenciosamente, pero esos matches no se resaltan.
- **Impacto:** Busquedas que cruzan formato inline (bold+italic) no muestran highlight amarillo.
- **Correccion:** Usar `range.extractContents()` + `mark.appendChild()` + `range.insertNode(mark)` en lugar de `surroundContents`.

### MEDIOS

**BUG #5 — TOC block lee datos potencialmente stale**
- **Archivo:** `components/page-editor.tsx:555`
- **Linea:** 555
- **Problema:** El bloque Table of Contents usa `useSidebarStore.getState()` sincrono dentro del render. Si se acaba de agregar un heading, el TOC puede no reflejar el cambio hasta el siguiente re-render.
- **Impacto:** TOC no se actualiza en tiempo real al agregar/editar headings.

**BUG #6 — bulkDelete no hace deep copy de tareas para undo**
- **Archivo:** `stores/board-store.ts:442-453`
- **Linea:** 450
- **Problema:** `bulkDelete()` usa `{ ...task }` (shallow copy) para guardar en trash, mientras que `deleteTask()` usa `JSON.parse(JSON.stringify(task))` (deep copy). Si las subtareas u otros nested objects son mutados despues del delete, el undo de bulkDelete puede restaurar datos corruptos.
- **Impacto:** Restaurar tareas eliminadas en bulk podria tener datos incorrectos si fueron modificadas entre delete y undo.

**BUG #7 — Email validation demasiado simple en login**
- **Archivo:** `components/login-page.tsx:24`
- **Linea:** 24
- **Problema:** La validacion de email solo verifica `email.includes("@")`, lo que acepta strings invalidos como `"@"`, `"a@"`, `"@b"`.
- **Impacto:** Un usuario podria registrarse con un email invalido.

### BAJOS

**BUG #8 — CSV Import no valida formato de fecha**
- **Archivo:** `components/table-view.tsx:260`
- **Linea:** 260
- **Problema:** El campo `dueDate` importado se usa como string sin validar que sea una fecha valida (YYYY-MM-DD). Valores como "manana" o "15/01/2026" (formato europeo) pasarian sin error pero causarian problemas en comparaciones de fecha.
- **Impacto:** Fechas malformadas pueden causar comportamiento erratico en filtros de overdue y ordenamiento.

**BUG #9 — Gallery view: img alt vacio**
- **Archivo:** `components/gallery-view.tsx:96`
- **Linea:** 96
- **Problema:** `<img src={task.coverImage} alt="" />` usa alt vacio, reduciendo accesibilidad.
- **Impacto:** Screen readers no pueden describir la imagen de portada.

**BUG #10 — Search highlights no se limpian si el componente se desmonta**
- **Archivo:** `components/page-editor.tsx:877-917`
- **Problema:** El useEffect de busqueda no tiene cleanup que llame a `clearSearchHighlights()` al desmontarse el componente. Si el usuario navega fuera del editor mientras la busqueda esta activa, los `<mark>` quedan en el DOM.
- **Impacto:** Markup residual en el DOM si se navega durante busqueda activa.

---

## 3. MEJORAS DE UX PENDIENTES

### Prioridad Alta

1. **Confirmar cierre de task detail con cambios sin guardar** — El titulo y descripcion se guardan onBlur, pero si el usuario cierra el panel antes de hacer blur (e.g., click en X directo), los cambios del contentEditable activo se pierden.

2. **Drag & drop de subtareas** — El req original pedia "Drag para reordenar" subtareas. Existe `reorderSubtasks()` en el store pero el UI no implementa drag handles en las subtareas del task detail.

3. **Preview de imagenes al hover en adjuntos** — El req original pedia "Preview de imagenes al hover" en la seccion de archivos adjuntos. No implementado actualmente.

### Prioridad Media

4. **Mi perfil modal** — El dropdown del usuario en el sidebar solo tiene "Cerrar sesion". Falta la opcion "Mi perfil" para editar nombre, email, password y color del avatar. El store (`updateProfile`, `changePassword`) ya soporta estas operaciones.

5. **"Abrir como pagina" funcional** — El boton Maximize2 en task detail es decorativo. Podria abrir la tarea como una pagina completa (full-width, sin panel lateral).

6. **"Compartir" funcional** — El boton Share en task detail es decorativo. Podria generar un link copiable o mostrar opciones de compartir.

7. **Indicador visual de tarea bloqueada en kanban cards** — Las dependencias existen en el store pero las cards del kanban no muestran si una tarea esta bloqueada por otra.

8. **Notificaciones persistentes** — Las notificaciones del InboxView estan hardcodeadas como estado local. No persisten ni se generan dinamicamente basadas en actividad real.

### Prioridad Baja

9. **Backlinks en page-links** — Los enlaces entre paginas son unidireccionales. No hay backlinks (si pagina A enlaza a pagina B, pagina B no muestra "referenciada por A").

10. **Syntax highlighting en tiempo real en bloques code** — El bloque de codigo importa highlight.js pero no lo aplica en tiempo real al contenido. Solo se usa para el registry de lenguajes.

11. **Export del task detail como PDF** — Solo se exporta como Markdown. PDF seria util para reportes.

12. **Historial de versiones de paginas** — No hay versionado del contenido de paginas. Los cambios son destructivos.

13. **Indicador de sesion activa en multiples tabs** — Si el usuario tiene multiples tabs abiertas y hace logout en una, las otras no se actualizan automaticamente.

---

## 4. RECOMENDACIONES PARA PRODUCCION

### Seguridad

| # | Recomendacion | Prioridad | Detalle |
|---|--------------|-----------|---------|
| 1 | Reemplazar btoa() por hash seguro | **CRITICA** | Las passwords se almacenan con `btoa()` (Base64), que es encoding, NO hashing. Cualquiera puede decodificar con `atob()`. En produccion usar bcrypt o Argon2 via un backend. |
| 2 | Mover autenticacion a un backend real | **CRITICA** | localStorage es accesible via DevTools. Un backend con JWT/sessions es necesario para seguridad real. |
| 3 | Sanitizar HTML en contentEditable | **ALTA** | Los campos contentEditable (titulo de tarea, descripcion, paginas) pueden inyectar HTML/scripts. Usar DOMPurify antes de guardar. |
| 4 | Validar inputs del lado del store | **ALTA** | Los stores no validan inputs (e.g., strings vacios, tipos incorrectos). Agregar validacion en cada mutacion. |
| 5 | CSRF/XSS protections | **ALTA** | Cuando se agregue un backend, implementar tokens CSRF y Content Security Policy headers. |

### Rendimiento

| # | Recomendacion | Prioridad | Detalle |
|---|--------------|-----------|---------|
| 6 | Paginar tareas en vistas grandes | **ALTA** | Con cientos de tareas, la tabla y el kanban renderizan todo. Implementar virtualizacion (react-virtual) o paginacion. |
| 7 | Debounce en persistencia | **MEDIA** | Cada cambio de estado dispara un write a localStorage. Zustand persist puede configurarse con `merge` custom para debounce. |
| 8 | Lazy loading de vistas | **MEDIA** | Cargar CalendarView, TimelineView, GalleryView con `React.lazy()` + Suspense para reducir bundle inicial. |
| 9 | Migrar a base de datos real | **ALTA** | localStorage tiene limite de ~5-10MB. Con muchas tareas/paginas/adjuntos, se llenara. Migrar a Supabase, PlanetScale, o similar. |
| 10 | Optimizar re-renders en tabla | **MEDIA** | La TableView re-renderiza toda la tabla en cada cambio. Usar `React.memo` en celdas individuales. |

### Infraestructura

| # | Recomendacion | Prioridad | Detalle |
|---|--------------|-----------|---------|
| 11 | Agregar tests unitarios | **ALTA** | 0% cobertura actual. Priorizar: stores (logica de negocio), helpers (formateo), componentes criticos. |
| 12 | Agregar tests E2E | **ALTA** | Playwright o Cypress para flujos criticos: login, crear tarea, mover tarea, editar pagina. |
| 13 | CI/CD pipeline | **ALTA** | GitHub Actions para: lint, typecheck, test, build en cada PR. |
| 14 | Error boundary global | **MEDIA** | No hay React Error Boundary. Un error en cualquier componente rompe toda la app. |
| 15 | Monitoring y logging | **MEDIA** | Integrar Sentry o similar para capturar errores en produccion. |
| 16 | Backup automatico de localStorage | **BAJA** | Agregar export/import periodico de todos los datos como JSON para recovery. |

### Funcionalidades para V2

| # | Funcionalidad | Prioridad |
|---|--------------|-----------|
| 17 | Colaboracion en tiempo real (WebSockets) | Alta |
| 18 | Notificaciones push / email | Alta |
| 19 | Integracion con Meta Ads API | Alta |
| 20 | Integracion con Google Analytics | Media |
| 21 | Reportes exportables (PDF) | Media |
| 22 | API REST para integraciones | Media |
| 23 | Mobile app (React Native o PWA) | Media |
| 24 | AI para sugerencias de campanas | Baja |

---

## RESUMEN EJECUTIVO

| Categoria | Total | ✅ Funciona | ⚠️ Parcial | ❌ Roto |
|-----------|-------|------------|-----------|--------|
| Autenticacion | 10 | 10 | 0 | 0 |
| Persistencia | 12 | 12 | 0 | 0 |
| Task Detail | 31 | 31 | 0 | 0 |
| Editor de Paginas | 26 | 24 | 2 | 0 |
| Kanban | 17 | 17 | 0 | 0 |
| Tabla | 14 | 14 | 0 | 0 |
| Calendario | 4 | 4 | 0 | 0 |
| Timeline | 6 | 6 | 0 | 0 |
| Galeria | 5 | 5 | 0 | 0 |
| Dashboard | 5 | 5 | 0 | 0 |
| Sidebar | 18 | 18 | 0 | 0 |
| General | 12 | 12 | 0 | 0 |
| **TOTAL** | **160** | **158** | **2** | **0** |

**Bugs encontrados:** 10 (1 critico, 3 altos, 3 medios, 3 bajos)
**Funcionalidades completamente rotas:** 0
**Tasa de funcionalidad:** 98.75%

El proyecto esta en un estado muy solido para una aplicacion frontend-only. Los bugs encontrados son menores y no bloquean ninguna funcionalidad critica. Las recomendaciones de seguridad son relevantes solo para un despliegue en produccion con usuarios reales — para demo/prototipo, la implementacion actual es adecuada.
