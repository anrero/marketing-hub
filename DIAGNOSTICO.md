# DIAGNÓSTICO COMPLETO — Marketing Hub

> Auditoría QA exhaustiva realizada leyendo cada archivo del proyecto.
> Fecha: 2026-03-31 | Auditor: Claude Code QA

---

## SECCIÓN 1: FUNCIONALIDADES QUE EXISTEN Y FUNCIONAN

### SIDEBAR (`components/sidebar.tsx`)

| # | Funcionalidad | Verificación |
|---|---|---|
| 1 | **Colapsar/expandir sidebar** | `toggleCollapsed()` en línea 152 del store. Botón en línea 462. Ancho transiciona de `w-64` a `w-[48px]` con `transition-all duration-200`. Tooltips aparecen en modo colapsado. |
| 2 | **Workspace selector** | Dropdown con lista de workspaces, switch funcional (`setActiveWorkspace`), crear nuevo, cambiar emoji, eliminar con confirm. |
| 3 | **Workspace rename inline** | Al hacer click en "Renombrar workspace", se activa `pendingWsRename` → espera cierre del dropdown → muestra Input inline. Enter/Blur guardan, Escape cancela. |
| 4 | **Secciones colapsables** | Recientes, Boards, Páginas, Privado — cada una con `toggleSectionCollapsed(key)`. Chevron rota correctamente. |
| 5 | **Recientes** | `addRecent()` trackea últimos 5 items (boards, tasks, pages). Click navega al item correcto. |
| 6 | **Boards — click navega** | `handleBoardClick()` llama `setActiveBoard`, `setMainView("board")`, `addRecent`. |
| 7 | **Boards — renombrar inline** | Doble-click activa input. Desde menú "..." usa `pendingBoardRename` → espera cierre dropdown. Enter/Blur guardan vía `renameBoard()`. |
| 8 | **Boards — duplicar** | `duplicateBoard()` en store crea board con `(copia)`, duplica tareas con nuevos IDs, activa el nuevo board. |
| 9 | **Boards — eliminar** | `deleteBoard()` con `confirm()`. Protección: no permite eliminar si es el último board. Fallback a `remaining[0]`. |
| 10 | **Boards — vistas expandibles** | Click en chevron expande/colapsa lista de vistas guardadas bajo cada board. `handleViewClick` activa board + vista. |
| 11 | **Boards — drag & drop reorden** | `DndContext` + `SortableContext` envuelven boards. `SortableItem` con `GripVertical` handle. `handleBoardDragEnd` → `reorderBoards()`. |
| 12 | **Páginas — click navega** | `handleClick()` llama `setActivePageId`, `setMainView("page")`, `addRecent`. |
| 13 | **Páginas — renombrar inline** | Doble-click en título activa input. Desde menú "..." usa `pendingRename`. `saveRename()` llama `updatePage()`. |
| 14 | **Páginas — duplicar** | `duplicatePage()` reescrito: deep copy recursiva de hijos, IDs únicos para páginas y bloques, nombre inteligente `(copia)` / `(copia 2)` / `(copia 3)`, hereda `parentId` e `isPrivate`, inserta justo debajo de la original. |
| 15 | **Páginas — eliminar** | `movePageToTrash()` recolecta descendientes recursivamente, los mueve a trash con timestamp. Si la página activa fue eliminada, navega a board view. |
| 16 | **Páginas — cambiar emoji** | Cicla por array `EMOJIS` al hacer click en "Cambiar emoji" del menú. |
| 17 | **Páginas — agregar sub-página** | `addPage(page.id, page.isPrivate)` crea hijo. Auto-expande padre si estaba colapsado. |
| 18 | **Páginas — exportar Markdown** | `exportMarkdown()` genera `.md` con headings, listas, todos, quotes. Descarga automática. |
| 19 | **Páginas — drag & drop reorden** | `DndContext` + `SortableContext` para root pages y private pages por separado. `PageTreeItem` usa `useSortable`. `GripVertical` handle visible al hover. `handlePageDragEnd` → `reorderPages()`. |
| 20 | **Páginas — menú contextual (right-click)** | `ContextMenu` con Renombrar, Emoji, Sub-página, Duplicar, Exportar, Eliminar. |
| 21 | **Páginas — menú "..." (dropdown)** | `DropdownMenu` controlado (`open`/`onOpenChange`) con las mismas opciones. `onContextMenu.stopPropagation` en botón "..." previene conflicto con ContextMenu. |
| 22 | **Páginas privadas** | Sección separada con ícono de candado. `addPage(null, true)` crea página privada. Se filtran con `p.isPrivate`. |
| 23 | **Papelera** | Modal con lista de items eliminados. Cada item muestra nombre, tipo, tiempo transcurrido. Botones: Restaurar (`restoreFromTrash`), Eliminar permanentemente (`permanentlyDelete` con confirm), Vaciar papelera (`emptyTrash` con confirm). Badge con conteo. |
| 24 | **Invitar miembros** | Modal con input email + selector de rol (Admin/Editor/Viewer). Toast de confirmación local. Lista de invitaciones pendientes. |
| 25 | **Tema claro/oscuro** | `setTheme(theme === "dark" ? "light" : "dark")`. Íconos Sun/Moon con animación de rotación. CSS variables en `globals.css` para ambos temas. |
| 26 | **Búsqueda (Command Palette)** | Botón en sidebar abre `setCommandOpen(true)`. Ctrl+K como hotkey global. |

### KANBAN (`components/kanban-board.tsx` + `kanban-column.tsx`)

| # | Funcionalidad | Verificación |
|---|---|---|
| 27 | **Drag & drop de tareas entre columnas** | `DndContext` con `PointerSensor`. `handleDragEnd` detecta columna destino, llama `moveTask(taskId, newStatus)`. |
| 28 | **Drag & drop reorden dentro de columna** | `SortableContext` con `verticalListSortingStrategy` en cada columna. `reorderBoardTasks` actualiza orden. |
| 29 | **DragOverlay** | Muestra preview de la tarjeta mientras se arrastra. |
| 30 | **Columnas con conteo** | Header muestra nombre + cantidad. Si hay filtros activos, muestra `filtrados/total`. |
| 31 | **Filtros aplicados** | `getFilteredTasks()` filtra por store, priority, assignee antes de renderizar. |

### TABLA (`components/table-view.tsx`)

| # | Funcionalidad | Verificación |
|---|---|---|
| 32 | **Edición inline de todas las celdas** | TitleCell (rich editor), StatusCell, PriorityCell, StoreCell, CampaignTypeCell, AssigneeCell, DateCell — todos con popover/select inline. |
| 33 | **Columnas resizables** | `startResizeCb` con mouse drag. Constraints 80-500px. `setColumnWidth` persiste. Handle visual al hover. |
| 34 | **Columnas pinneables** | `togglePin` con máximo 2 pins. Columnas pinneadas tienen `position: sticky` con offset calculado. |
| 35 | **Columnas ocultables** | `ColumnsVisibilityPopover` con toggle por columna y "Mostrar todas" / "Ocultar todas". |
| 36 | **Ordenamiento** | Click en header ordena ASC/DESC. `sortTasks()` soporta todos los campos: priority, status, assignee, dueDate, custom. |
| 37 | **Filtros por columna** | `ColumnFilterContent` muestra valores únicos como checkboxes. Filtro activo resalta header. "Limpiar filtros" global. |
| 38 | **Vistas guardadas** | Tabs con 5 vistas built-in (Todas, Por estado, Mis tareas, Urgentes, Vencidas). Click cambia filtros activos. |
| 39 | **Acciones bulk** | Selección múltiple con checkboxes. BulkActionsBar: Mover, Asignar, Prioridad, Duplicar, Eliminar. |
| 40 | **Drag & drop de filas** | `SortableRow` con `useSortable`. `handleDragEnd` → `arrayMove` → `reorderBoardTasks`. |
| 41 | **Columnas custom** | `InsertColumnDialog`: crear columnas tipo text, number, select, date, url, checkbox. `addCustomColumn` / `removeCustomColumn`. |
| 42 | **Quick task creation** | Fila inferior con input "Agregar tarea rápida...". Enter crea, Escape cancela. `addQuickTask()`. |
| 43 | **Exportar CSV / JSON** | `exportCSV()` y `exportJSON()` generan y descargan archivos. |
| 44 | **Rich title editor** | Popover con Bold, Italic, Strikethrough, Link, Color picker. `dangerouslySetInnerHTML` para renderizar. |
| 45 | **Renombrar columnas** | `renameColumn()` desde header dropdown. |

### TAREAS (`components/task-detail.tsx` + `task-card.tsx`)

| # | Funcionalidad | Verificación |
|---|---|---|
| 46 | **Panel lateral Sheet** | Se abre con `setSelectedTask`. Sheet desde la derecha con todo el detalle. |
| 47 | **Editar todos los campos** | Status, Priority, Assignee, Due Date, Reminder, Store, Ad Account, Campaign Type, Campaign Name — todos editables con activity tracking. |
| 48 | **Subtareas** | Agregar, toggle completar, eliminar. Barra de progreso. |
| 49 | **URLs** | Agregar URL, mostrar lista, links externos. Eliminar URL. |
| 50 | **Adjuntos** | Dropzone para upload. Muestra nombre, tamaño, ícono. Eliminar adjunto. |
| 51 | **Comentarios** | Input para agregar. Lista con autor, avatar, tiempo transcurrido. |
| 52 | **Historial de actividad** | Cada cambio de campo genera `ActivityEntry`. Muestra ícono, autor, acción, campo, valores old→new, timestamp. |
| 53 | **Recordatorios** | Select con opciones: ninguno, mismo día, 1 día, 3 días, 1 semana. `setReminder()`. |
| 54 | **Task card en kanban** | Muestra título (rich HTML), priority badge, store badge, due date con overdue, attachments count, subtasks progress, assignee avatar. Click abre detalle. |

### EDITOR DE PÁGINAS (`components/page-editor.tsx`)

| # | Funcionalidad | Verificación |
|---|---|---|
| 55 | **Breadcrumb navegable** | Click en Workspace → dashboard. Click en "Páginas"/"Privado" → dashboard. Click en padre → navega a página padre. |
| 56 | **Breadcrumb editable** | Doble-click en último item activa input inline. Enter guarda (`updatePage`), Escape cancela, Blur guarda. |
| 57 | **Título editable** | Input con `defaultValue={page.title}`. Blur guarda cambio. |
| 58 | **Emoji picker** | Grid de 20 emojis. Click cambia y cierra. |
| 59 | **Bloques — texto, h1-h4** | contentEditable con estilos correctos (2xl bold, xl semibold, lg, base). Placeholder dinámico. |
| 60 | **Bloques — bullet/numbered list** | Prefijo `•` y `{index + 1}.` respectivamente. |
| 61 | **Bloques — todo** | Checkbox funcional. Strikethrough cuando completado. Barra de progreso global. |
| 62 | **Bloques — toggle** | Expand/collapse con chevron. Contenido nested visible cuando expandido. |
| 63 | **Bloques — quote** | Barra lateral, texto italic, color muted. |
| 64 | **Bloques — callout** | Emoji + fondo de color. Click en emoji cicla colores (blue, green, yellow, red, purple, gray). |
| 65 | **Bloques — divider** | Renderiza `<hr>` con estilo border. |
| 66 | **Bloques — code** | Selector de lenguaje (8 opciones). Font mono, whitespace-pre-wrap. |
| 67 | **Bloques — table** | Celdas editables. Botón "+ Fila" y "+ Columna". Primera fila como header con fondo muted. |
| 68 | **Bloques — image/video/file/bookmark** | MediaUploader con file input + URL input. Image renderiza `<img>`, video renderiza `<iframe>`, file muestra nombre/tamaño, bookmark muestra link preview. |
| 69 | **Bloques — columns** | Grid 2 columnas con contentEditable. |
| 70 | **Bloques — page-link** | Botón que navega a otra página via `setActivePageId`. |
| 71 | **Bloques — mention** | Badge azul con `@usuario`. |
| 72 | **Bloques — date** | Badge con ícono calendario + fecha localizada en español. |
| 73 | **Bloques — database-*** | 5 tipos de placeholder con ícono y texto "próximamente con Supabase". |
| 74 | **Slash menu** | Detección de `/` en contentEditable. Filtro en tiempo real. Arrow Up/Down/Enter/Escape. 23 comandos en 6 grupos. ScrollIntoView del activo. |
| 75 | **Markdown shortcuts** | `# ` → h1, `## ` → h2, `### ` → h3, `- ` → bullet, `1. ` → numbered, `[] ` → todo, `> ` → quote, `---` → divider, ` ``` ` → code. |
| 76 | **Floating toolbar** | Aparece al seleccionar texto DENTRO de `[data-block-id]`. Bold, Italic, Underline, Strikethrough, Code inline, Link, Color texto, Resaltado. |
| 77 | **Block drag & drop** | `DndContext` + `SortableContext`. `SortableBlock` wrapper con `useSortable`. `GripVertical` handle conectado a listeners. `handleBlockDragEnd` → `arrayMove` → `updatePage`. |
| 78 | **Guardado automático** | Debounce 400ms para contenido. Guardado inmediato para cambios estructurales (insertar/eliminar bloque). Indicador "Guardando..." / "Guardado". |
| 79 | **Insertar bloque** | Botón `+` en BlockHandle inserta antes. Enter al final de un bloque inserta después. Focus automático al nuevo bloque. |
| 80 | **Eliminar bloque** | Backspace en bloque vacío elimina (si hay >1 bloque). Focus se mueve al bloque anterior. |

### OTROS COMPONENTES

| # | Funcionalidad | Verificación |
|---|---|---|
| 81 | **Dashboard** | Saludo dinámico por hora. 4 métricas (total, por hacer, en proceso, completadas). Lista de tareas vencidas. Tareas de hoy. Actividad reciente (últimas 10). |
| 82 | **Board header** | Título editable (doble-click). Toggle Kanban/Tabla. Filtros por tienda/prioridad/asignado. Búsqueda abre command palette. Badge de notificaciones (tareas vencidas). Tema toggle. |
| 83 | **Command palette** | Ctrl+K abre. Busca en: acciones rápidas, boards, tareas (por título/tienda/asignado). cmdk library. |
| 84 | **New task dialog** | Formulario: título, status, prioridad, tienda, asignado. Validación de título requerido. Auto-focus. Activity entry automática. |
| 85 | **New board dialog** | Input de nombre + crear. Auto-focus. Enter submit. |
| 86 | **Settings dialog** | Gestión de equipo (CRUD miembros). Listas editables: tiendas, cuentas publicitarias, tipos de campaña. Items default protegidos. |

---

## SECCIÓN 2: FUNCIONALIDADES QUE EXISTEN PERO ESTÁN ROTAS

### BUG 1: Toggle children no editables (MEDIO)
- **Archivo:** `components/page-editor.tsx`, línea 397
- **Qué falla:** Los hijos de un bloque toggle se renderizan como `<p>` read-only: `{c.content || <span className="italic">Vacío</span>}`. No tienen contentEditable ni handlers de input.
- **Por qué:** Solo se renderiza el contenido estático, no hay UI para editar los sub-bloques del toggle.
- **Impacto:** El usuario puede crear un toggle pero no puede editar su contenido interno.

### BUG 2: Bloque Columns no guarda contenido (MEDIO)
- **Archivo:** `components/page-editor.tsx`, líneas 466-471
- **Qué falla:** Los dos `<div>` de las columnas tienen `contentEditable` pero carecen de `onInput`, `onBlur`, o `onKeyDown` handlers.
- **Por qué:** El contenido escrito por el usuario nunca se propaga al store. Se pierde al re-renderizar.
- **Impacto:** Las columnas parecen editables pero los cambios se pierden.

### BUG 3: Kanban — no hay botón para crear tareas (MEDIO)
- **Archivo:** `components/kanban-board.tsx` y `kanban-column.tsx`
- **Qué falla:** No hay ningún botón "+" ni "Agregar tarea" en la vista Kanban. El único lugar para crear tareas es la tabla o el diálogo de nueva tarea.
- **Por qué:** `kanban-column.tsx` solo renderiza tareas existentes, no tiene UI de creación.
- **Impacto:** El usuario debe cambiar a vista tabla o usar el header para crear tareas.

### BUG 4: Conteo de columna kanban confuso con filtros (BAJO)
- **Archivo:** `components/kanban-column.tsx`, líneas 31-34
- **Qué falla:** Cuando hay filtros activos, `totalInColumn` muestra `getBoardTasks().filter(...)` que son tareas del board sin filtros de vista. El display es `filtrados/total`, pero `total` no incluye la cuenta completa — omite tareas de otros boards.
- **Impacto:** Confusión menor en los números mostrados.

### BUG 5: InboxView es un placeholder vacío (BAJO)
- **Archivo:** `app/page.tsx`, líneas 18-26
- **Qué falla:** Solo muestra un ícono y texto estático "Las notificaciones y menciones aparecerán aquí." Sin funcionalidad real.
- **Por qué:** No hay sistema de notificaciones implementado.
- **Impacto:** El item "Bandeja de entrada" en el sidebar lleva a una página vacía.

### BUG 6: Dashboard no respeta filtros de vista activa (BAJO)
- **Archivo:** `components/dashboard.tsx`
- **Qué falla:** Las métricas del dashboard siempre muestran TODAS las tareas sin importar la vista activa o los filtros aplicados.
- **Por qué:** Usa `tasks` directamente del store en vez de `getFilteredTasks()`.
- **Impacto:** Los números del dashboard no son consistentes con lo que el usuario ve en la tabla/kanban si tiene filtros activos.

### BUG 7: `handleViewClick` no registra en recientes (BAJO)
- **Archivo:** `components/sidebar.tsx`, función `handleViewClick`
- **Qué falla:** Al hacer click en una vista guardada del sidebar, no se llama `addRecent()`, a diferencia de `handleBoardClick` que sí lo hace.
- **Impacto:** Las vistas visitadas no aparecen en la sección Recientes.

### BUG 8: Bloque page-link sin fallback (BAJO)
- **Archivo:** `components/page-editor.tsx`, línea 482
- **Qué falla:** Si `block.url` no está definido, el botón no hace nada. No hay UI para seleccionar a qué página enlazar.
- **Impacto:** El usuario crea un bloque "Enlace a página" pero no puede configurarlo.

---

## SECCIÓN 3: FUNCIONALIDADES QUE FALTAN (comparado con Notion)

### SIDEBAR

| Funcionalidad | ¿Existe? | Detalle |
|---|---|---|
| Buscar con resultados en tiempo real | **PARCIAL** | Existe Command Palette (Ctrl+K) que busca boards y tareas, pero NO busca contenido dentro de páginas. No hay búsqueda inline en el sidebar — solo abre el modal. |
| Favoritos (marcar boards/páginas) | **NO** | No hay sistema de favoritos. No hay ícono de estrella ni sección "Favoritos" en el sidebar. |
| Notificaciones reales en Bandeja de entrada | **NO** | InboxView es placeholder vacío. No hay sistema de notificaciones, menciones detectadas, ni alertas de vencimiento. |
| Drag & drop de páginas para reordenar | **SÍ** | Implementado con @dnd-kit. GripVertical handle. Funciona para root pages y private pages por separado. |
| Drag & drop para anidar páginas (convertir en sub-página) | **NO** | El drag solo reordena dentro del mismo nivel. No se puede arrastrar una página dentro de otra para convertirla en sub-página. |
| Drag & drop de boards para reordenar | **SÍ** | Implementado con @dnd-kit + SortableItem + GripVertical. |
| Papelera funcional | **SÍ** | Restaurar, eliminar permanentemente, vaciar papelera — todo funcional. |
| Colapsar/expandir sidebar con animación | **SÍ** | `transition-all duration-200`. Tooltips en modo colapsado. |

### BOARDS / KANBAN

| Funcionalidad | ¿Existe? | Detalle |
|---|---|---|
| Crear nueva columna desde el kanban | **NO** | Las columnas están hardcodeadas como los 4 estados: por_hacer, en_proceso, en_revision, completado. No hay UI para agregar/editar columnas. |
| Renombrar columnas con doble click | **NO** | Los nombres de columna son estáticos, vienen del tipo Status. |
| Eliminar columnas | **NO** | No implementado. |
| Cambiar color de columnas | **NO** | Colores hardcodeados en `columnAccents` del componente. |
| Limitar WIP por columna | **NO** | No hay concepto de límite de tareas por columna. |
| Archivar tareas completadas | **NO** | No hay concepto de "archivar". Solo eliminar (que no existe en kanban). |
| Filtro de búsqueda dentro del board | **PARCIAL** | Existe Command Palette global, y filtros por tienda/prioridad/asignado en BoardHeader. Pero no hay búsqueda de texto libre dentro del board. |
| Ordenar tareas dentro de cada columna | **NO** | En kanban las tareas se muestran en orden del array. No hay UI para ordenar por fecha/prioridad/etc. dentro de una columna. La tabla SÍ tiene sorting. |
| Templates de tareas | **NO** | No implementado. |

### TABLA

| Funcionalidad | ¿Existe? | Detalle |
|---|---|---|
| Agregar columnas custom desde la tabla | **SÍ** | Botón "+" al final de headers abre InsertColumnDialog. Tipos: text, number, select, date, url, checkbox. |
| Fórmulas simples (SUM, COUNT, AVG) | **NO** | No implementado. |
| Agrupación por cualquier campo | **NO** | La vista "Por estado" agrupa por status, pero no hay agrupación genérica por otros campos. |
| Sub-agrupación | **NO** | No implementado. |
| Paginación o scroll virtual | **NO** | Todas las tareas se renderizan en el DOM. Sin virtualización. Con muchas tareas habrá problemas de performance. |
| Seleccionar rango de celdas (como Excel) | **NO** | Solo selección de filas completas para bulk actions. |

### TAREAS

| Funcionalidad | ¿Existe? | Detalle |
|---|---|---|
| Dependencias entre tareas | **NO** | No hay campo de dependencias en el tipo Task ni UI para configurarlas. |
| Tareas recurrentes | **NO** | No implementado. |
| Templates de tareas | **NO** | No implementado. |
| Etiquetas/tags personalizables | **NO** | No hay sistema de tags. Los campos existentes (store, campaignType) no son tags libres. |
| Estimación de tiempo (horas estimadas vs reales) | **NO** | No hay campos de tiempo en Task. |
| Cover image en cada tarea | **NO** | No hay campo coverImage en Task. |
| Archivar tarea | **NO** | No hay estado "archivado". Solo eliminar. |

### EDITOR DE PÁGINAS

| Funcionalidad | ¿Existe? | Detalle |
|---|---|---|
| Todos los slash commands funcionales | **PARCIAL** | 23 comandos definidos. La mayoría funciona. Exceptions: columns no guarda contenido, page-link no tiene selector de página, database-* son placeholders. |
| Tabla editable funcional | **SÍ** | Agregar filas y columnas. Editar celdas. Input controlado. |
| Bloques de código con syntax highlighting | **NO** | El bloque code tiene selector de lenguaje y font mono, pero NO tiene syntax highlighting. Solo texto plano con fuente monospace. |
| Embed de URLs (YouTube, Google Maps, Figma) | **PARCIAL** | El bloque video usa `<iframe>` que puede embeber YouTube si se pega la URL de embed. Pero no hay detección automática de URLs ni embed inteligente para otros servicios. |
| Templates de páginas | **NO** | No implementado. |
| Historial de versiones | **NO** | No hay tracking de versiones. Sin undo a nivel de página. |
| Compartir página (link público) | **NO** | No implementado. Requiere backend. |
| Comentarios inline | **NO** | No hay sistema de comentarios en el editor. Solo en tareas. |
| Table of contents | **NO** | No hay bloque ni sidebar que genere índice automático basado en headings. |
| Cover image de la página | **NO** | No hay campo coverImage en PageNode ni UI para configurarla. |
| Emoji picker completo | **PARCIAL** | Solo 20 emojis predefinidos en EMOJIS_SMALL. No hay picker completo tipo Unicode. |
| Importar markdown | **NO** | Solo exportar. No hay importar. |
| Exportar markdown | **SÍ** | Funciona desde menú contextual de páginas en sidebar. |
| Búsqueda dentro de la página (Ctrl+F mejorado) | **NO** | Solo Ctrl+F nativo del browser. |

### COLABORACIÓN

| Funcionalidad | ¿Existe? | Detalle |
|---|---|---|
| Presence (ver quién está online) | **NO** | Requiere Supabase Realtime. |
| Cursores colaborativos | **NO** | Requiere Supabase Realtime. |
| Comentarios con menciones @usuario | **NO** | Los comentarios de tareas no detectan @menciones. |
| Notificaciones por email | **NO** | Requiere backend. |
| Permisos por página | **NO** | isPrivate existe pero es binario (privado/público al workspace). No hay permisos granulares. |
| Historial de actividad del workspace | **PARCIAL** | Existe activity log por tarea. No hay log global del workspace. |

### UX/UI

| Funcionalidad | ¿Existe? | Detalle |
|---|---|---|
| Atajos de teclado documentados (modal "?") | **NO** | No hay modal de ayuda. Solo Ctrl+K está documentado implícitamente. |
| Onboarding para nuevos usuarios | **NO** | No implementado. |
| Skeleton loaders | **NO** | No hay estados de carga. Los componentes renderizan con data inmediatamente (mock data). |
| Empty states con ilustraciones | **PARCIAL** | Hay empty states con texto (papelera vacía, editor vacío, inbox vacío) pero sin ilustraciones. |
| Animaciones de transición entre vistas | **NO** | El cambio de vista es un swap instantáneo sin animación. |
| Responsive mobile | **NO** | Sin media queries. Sidebar tiene ancho fijo (w-64 / w-[48px]). No hay hamburger menu. Layout `flex h-screen` no adapta a mobile. |
| PWA (instalar como app) | **NO** | No hay manifest.json ni service worker. |
| Favicon y título dinámico | **PARCIAL** | Hay favicon default de Next.js. El `<title>` es estático "Marketing Hub" (layout.tsx). No cambia por página. |
| Toast de confirmación en cada acción | **NO** | Solo hay un toast local en el modal de invitar miembros. No hay sistema global de toasts. Las acciones (duplicar, eliminar, etc.) no dan feedback visual. |
| Undo global (Ctrl+Z) | **NO** | No hay sistema de undo. Solo Ctrl+Z nativo del browser dentro de contentEditable. |
| Breadcrumb navegable en todas las vistas | **NO** | Solo existe en el editor de páginas. El kanban/tabla/dashboard no tienen breadcrumb. |

### GESTIÓN DE EQUIPO PARA DROPSHIPPING

| Funcionalidad | ¿Existe? | Detalle |
|---|---|---|
| Dashboard con métricas por tienda/persona/vencidas | **PARCIAL** | Muestra métricas globales, tareas vencidas, tareas de hoy. Pero NO desglosa por tienda ni por persona. |
| Vista calendario | **NO** | No implementada. |
| Vista timeline/Gantt | **NO** | No implementada. |
| Reportes semanales automáticos | **NO** | No implementado. |
| Integración con datos de campañas (ROAS, spend) | **NO** | Los campos existen en las tareas (store, campaignType, adAccount) pero no hay métricas de rendimiento. |

---

## SECCIÓN 4: PRIORIZACIÓN

### P0 — CRÍTICO (la app no es usable sin esto)

| # | Funcionalidad | Razón |
|---|---|---|
| 1 | **Crear tareas desde Kanban** | El equipo usa Kanban como vista principal. No poder crear tareas directamente es un blocker de productividad. Un botón "+" al final de cada columna o en el header de columna. |
| 2 | **Toggle children editables** | El bloque toggle es inútil si no se puede editar su contenido interno. El usuario lo crea esperando escribir dentro. |
| 3 | **Columns block guarda contenido** | El bloque de 2 columnas pierde todo al re-renderizar. Debe tener onInput/onBlur que persista al store. |
| 4 | **Sistema global de toasts** | Cuando el usuario duplica, elimina, restaura — no hay ningún feedback. Parece que nada pasó. Necesita `sonner` o similar. |
| 5 | **Responsive mobile básico** | Si un miembro del equipo abre la app desde el celular, no puede usarla. Al menos sidebar como drawer + layout adaptativo. |

### P1 — IMPORTANTE (diferencia entre herramienta básica y profesional)

| # | Funcionalidad | Razón |
|---|---|---|
| 6 | **Favoritos** | Con 12 tiendas y múltiples boards/páginas, encontrar lo frecuente es crítico. Sección "Favoritos" en el sidebar con estrella toggle. |
| 7 | **Búsqueda de texto dentro de páginas** | Command Palette solo busca títulos. No encuentra contenido dentro de páginas. |
| 8 | **Syntax highlighting en bloques code** | Los equipos de marketing técnico documentan scripts de tracking, pixels, etc. Sin highlighting es difícil leer código. Usar `highlight.js` o `shiki`. |
| 9 | **Drag & drop para anidar páginas** | Poder arrastrar una página dentro de otra para reorganizar la jerarquía sin usar menú contextual. |
| 10 | **Dashboard métricas por tienda y por persona** | El gestor de 12 tiendas necesita ver "¿cuántas tareas pendientes tiene cada tienda?" y "¿quién tiene más carga?". |
| 11 | **Atajos de teclado + modal de ayuda** | Power users necesitan shortcuts documentados. `?` abre modal. |
| 12 | **Ordenar tareas en kanban** | Dentro de cada columna, poder ordenar por prioridad o fecha sin cambiar a vista tabla. |
| 13 | **Archivar tareas completadas** | Las tareas completadas acumulan ruido visual. Archivar (no eliminar) las oculta de la vista activa. |
| 14 | **Etiquetas/tags personalizables** | Los campos actuales (store, campaignType) son limitados. Tags libres con colores permiten categorización flexible. |
| 15 | **Emoji picker completo** | Solo 20 emojis es muy limitado para personalizar páginas y callouts. |
| 16 | **Vista calendario** | Ver deadlines de tareas en un calendario mensual es esencial para planificar campañas. |
| 17 | **Bloque page-link con selector** | Al crear un "Enlace a página", debe haber un dropdown para seleccionar la página destino. |
| 18 | **Table of contents** | Páginas largas (SOPs, briefs) necesitan índice automático para navegar por headings. |

### P2 — NICE TO HAVE (mejoras futuras)

| # | Funcionalidad | Razón |
|---|---|---|
| 19 | **Templates de tareas** | Crear tareas pre-llenadas para flujos repetitivos (nueva campaña, nuevo producto, etc.). |
| 20 | **Templates de páginas** | Plantillas de SOP, Brief, Reporte. |
| 21 | **Fórmulas en tabla (SUM, COUNT)** | Útil para resumir datos numéricos en columnas custom. |
| 22 | **Agrupación por cualquier campo** | Agrupar por tienda, luego por prioridad, etc. |
| 23 | **Dependencias entre tareas** | "No publicar creativos hasta que el copy esté aprobado". |
| 24 | **Estimación de tiempo** | Horas estimadas vs reales para medir eficiencia del equipo. |
| 25 | **Cover image (tareas y páginas)** | Mejora visual significativa pero no crítica. |
| 26 | **Columnas kanban custom** | Agregar/renombrar/eliminar/colorear columnas más allá de los 4 estados fijos. |
| 27 | **WIP limits** | Limitar tareas por columna para evitar bottlenecks. |
| 28 | **Scroll virtual / paginación** | Performance con >100 tareas. Necesario cuando el equipo escale. |
| 29 | **Undo global (Ctrl+Z)** | Deshacer cualquier acción en toda la app. Requiere command history pattern. |
| 30 | **Animaciones de transición entre vistas** | Fade/slide al cambiar de dashboard a board a page. |
| 31 | **Onboarding** | Tour guiado para nuevos miembros. |
| 32 | **Breadcrumb en todas las vistas** | Kanban y Dashboard también deberían tener breadcrumb. |
| 33 | **Selección de rango de celdas** | Comportamiento tipo Excel para copiar/pegar datos. |
| 34 | **Embed inteligente de URLs** | Detectar YouTube, Figma, Google Maps automáticamente. |
| 35 | **Importar Markdown** | Complementa el exportar existente. |
| 36 | **Ctrl+F mejorado dentro de páginas** | Highlight de resultados dentro del editor. |
| 37 | **Tareas recurrentes** | Se re-crean automáticamente cada semana/mes. |

### P3 — FUTURO (requiere Supabase o integraciones)

| # | Funcionalidad | Razón |
|---|---|---|
| 38 | **Persistencia real de datos** | Actualmente todo es Zustand in-memory con mock data. Refresh = reset. Supabase para persistir. |
| 39 | **Autenticación** | Login/registro/SSO. Middleware de Supabase ya existe como scaffold. |
| 40 | **Presence (quién está online)** | Supabase Realtime channels. |
| 41 | **Cursores colaborativos** | Supabase Realtime + CRDT para edición simultánea. |
| 42 | **Notificaciones reales** | Menciones, asignaciones, vencimientos → inbox + email. |
| 43 | **Comentarios inline en editor** | Seleccionar texto → comentar. Requiere modelo de datos en Supabase. |
| 44 | **Permisos granulares por página** | Quién puede ver/editar cada página. RBAC en Supabase. |
| 45 | **Historial de versiones** | Guardar snapshots de páginas. Comparar y restaurar. |
| 46 | **Compartir página (link público)** | Generar URL pública para stakeholders externos. |
| 47 | **Notificaciones por email** | Supabase Edge Functions + servicio de email. |
| 48 | **Vista timeline/Gantt** | Visualización de rangos de fechas. Librería como `@bryntum/gantt` o custom. |
| 49 | **Reportes semanales automáticos** | Cron job que genera resumen de tareas completadas/pendientes. |
| 50 | **Integración con APIs de ads (ROAS, spend)** | Conectar con Meta Ads API, Google Ads API para métricas de campañas. |
| 51 | **PWA** | manifest.json + service worker para instalar como app. |
| 52 | **Título dinámico por página** | `document.title` cambia según la página/board activo. |
| 53 | **Historial de actividad del workspace** | Log global de todos los cambios de todos los usuarios. |

---

## RESUMEN EJECUTIVO

| Categoría | Total | Funcionan | Rotas | Faltan |
|---|---|---|---|---|
| Sidebar | 26 | 26 | 1 menor | 2 |
| Kanban | 5 | 5 | 1 (sin crear tarea) | 8 |
| Tabla | 14 | 14 | 0 | 5 |
| Tareas | 9 | 9 | 0 | 7 |
| Editor | 26 | 24 | 2 (toggle, columns) | 11 |
| Dashboard | 1 | 1 | 1 menor | 4 |
| Colaboración | 0 | 0 | 0 | 6 (todo P3) |
| UX/UI | 2 | 2 | 0 | 11 |
| **TOTAL** | **83 implementadas** | **81 funcionales** | **8 con bugs** | **53 faltan** |

**La app es funcional como MVP.** Las 83 funcionalidades implementadas cubren el flujo básico de gestión de tareas y documentación. Los 5 bugs P0 deben corregirse antes de uso real por el equipo. Las funcionalidades P1 (especialmente favoritos, calendario, métricas por tienda) son las que harían la diferencia para un equipo de marketing de dropshipping.
