# ETHF Cuaderno de Comunicados - Complete Business Logic Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Data Model & Structures](#4-data-model--structures)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Role System](#6-role-system)
7. [Configuration System (Settings)](#7-configuration-system-settings)
8. [Core Business Logic: Communications](#8-core-business-logic-communications)
9. [Views & Pages](#9-views--pages)
10. [Filtering System](#10-filtering-system)
11. [Automated Reports & Alerts (Cron)](#11-automated-reports--alerts-cron)
12. [API Endpoints (tRPC)](#12-api-endpoints-trpc)
13. [Deployment](#13-deployment)

---

## 1. Project Overview

**Cuaderno de Comunicados** (Communications Notebook) is a web application built for **Escuela Técnica Henry Ford** (https://henryford.edu.ar). It is a digital communications tracking system for a secondary school (years 1-7) that allows **teachers** to register formal communications about student behavior/incidents, and allows **administrators** (directorate/preceptors) to track, follow up, categorize, and manage those communications.

### Core Purpose

The system replaces a physical "cuaderno de comunicados" (communications notebook) with a digital workflow:

1. A **teacher** observes a student incident/behavior during class
2. The teacher registers the communication in the system, selecting a predefined reason (message), the subject, the student(s), the date/time, and a pedagogical action they took
3. An **administrator** (school directorate or preceptor) reviews the communication, adds follow-up notes, changes its state, and categorizes it
4. The system automatically sends **email alerts** when patterns are detected (e.g., a student accumulating too many communications)

### Key Concepts

| Spanish Term | English Translation | Meaning |
|---|---|---|
| Comunicación / Comunicado | Communication | A formal record of a student incident/behavior |
| Docente | Teacher | A teacher who creates communications |
| Estudiante | Student | The student about whom the communication is written |
| Matrícula | Enrolment | Student ID number |
| Materia | Subject | Academic subject (e.g., Math, History) |
| Curso / Año | Course / Year | Academic year level (1° through 7°) |
| Motivo | Reason/Motive | Predefined message describing the incident |
| Acción pedagógica | Pedagogical action | What the teacher did in response to the incident |
| Seguimiento | Follow-up | Notes from the directorate/preceptors about the case |
| Preceptoría | Preceptor's office | School staff that manages student discipline/coordination |
| Equipo directivo | Directorate | School leadership/management team |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 13.2.4 (Pages Router) |
| Language | TypeScript 5.0.2 |
| API | tRPC 10.18.0 (type-safe RPC) |
| Database | SQLite via Prisma ORM 4.11.0 |
| Authentication | NextAuth 4.21.0 with Azure AD |
| UI Library | Material-UI (MUI) 5.12.2 |
| Data Grid | MUI X DataGrid 6.3.0 |
| Date Pickers | MUI X Date Pickers 6.3.0 |
| Styling | Tailwind CSS 3.3.0 + Emotion (CSS-in-JS) |
| State Management | React Query (via tRPC) + React useState + URL query state |
| Code Editor | Monaco Editor (for JSON config editing) |
| Email | Nodemailer 6.9.1 |
| Scheduler | cron 2.3.0 (Node.js) |
| Validation | Zod 3.21.4 |
| Date Library | dayjs 1.11.7 (Spanish locale) |
| Serialization | SuperJSON 1.12.2 |

---

## 3. Architecture

### Project Structure

```
ethf_cuaderno_comunicados/
├── prisma/
│   └── schema.prisma              # Database schema (SQLite)
├── public/
│   ├── fonts/                     # Inter font files
│   ├── favicon.ico
│   └── icon.svg
├── src/
│   ├── cron.mjs                   # Background cron job process
│   ├── env.mjs                    # Environment variable validation (Zod)
│   ├── settings.mjs               # Settings class: data import, lookup, validation
│   ├── pages/
│   │   ├── _app.tsx               # App wrapper (providers, locale)
│   │   ├── index.tsx              # Home page (dashboard)
│   │   ├── comunicaciones.tsx     # Communications list (DataGrid)
│   │   ├── comunicaciones/[id].tsx # Communication detail page
│   │   ├── nueva-comunicacion.tsx # Create new communication form
│   │   ├── settings/index.tsx     # Admin settings (JSON editor)
│   │   └── api/
│   │       ├── auth/[...nextauth].ts  # Auth handler
│   │       ├── trpc/[trpc].ts         # tRPC handler
│   │       ├── cron.tsx               # Cron job endpoint (reports)
│   │       └── settings/[file].ts     # Settings file API
│   ├── server/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── auth.ts                # NextAuth configuration
│   │   └── api/
│   │       ├── trpc.ts            # tRPC context, middleware, procedures
│   │       └── root.ts            # ALL API route definitions
│   ├── lib/
│   │   ├── layout.tsx             # Authenticated layout wrapper
│   │   ├── menus.ts               # Navigation menu configuration
│   │   ├── metadata.ts            # GlobalMetadata key-value service
│   │   ├── useFilters.ts          # URL-persisted filter state hook
│   │   ├── ProtectedRoute.tsx     # Auth guard component
│   │   ├── components/
│   │   │   ├── AppBar.tsx         # Top bar with search, drawer, user
│   │   │   ├── Communications.tsx # Communication list component
│   │   │   ├── FileEditor.tsx     # (empty/unused)
│   │   │   └── Select.tsx         # Custom dropdown (Headless UI)
│   │   ├── reports/
│   │   │   └── reports.tsx        # HTML email report renderer
│   │   └── util/
│   │       ├── useUserRole.tsx    # Hook: isAdmin, isTeacher
│   │       └── nameUtils.ts      # Name formatting utilities
│   ├── utils/
│   │   └── api.ts                 # tRPC client setup
│   └── styles/
│       └── globals.css            # Global CSS
├── Dockerfile                     # Docker deployment
├── package.json
└── [config files]
```

### Data Flow

```
Browser (React + MUI)
    ↓ tRPC calls
Next.js API (tRPC router in root.ts)
    ↓ reads/writes
Prisma ORM → SQLite database (communications, sessions, metadata)
    ↓ reads
Settings class (settings.mjs) → JSON files on disk (teachers, students, subjects, general config)
```

The system uses a **hybrid data model**:
- **Transactional data** (communications, sessions, metadata) lives in SQLite via Prisma
- **Reference/configuration data** (teachers, students, subjects, messages, settings) lives in JSON files on disk, loaded and validated by the `Settings` class

### Process Architecture

When the application starts (`npm start`), two processes run in parallel via `npm-run-all`:
1. **`start:app`** — `next start`: The Next.js web server
2. **`start:cron`** — `node src/cron.mjs`: A standalone cron job process that periodically triggers the `/api/cron` endpoint

---

## 4. Data Model & Structures

### 4.1 Database Models (Prisma/SQLite)

#### Communication (core entity)

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | String (CUID) | auto | Primary key |
| `teacherEmail` | String | — | Email of the teacher who created the record |
| `studentEnrolment` | String | — | Student enrollment ID/number |
| `subjectCode` | String | — | Subject code (e.g., "MAT1", "HIS3") |
| `message` | String | — | The predefined communication reason text |
| `action_taken` | String | `""` | The pedagogical action taken by the teacher |
| `comment` | String | — | Additional freeform details from the teacher |
| `followup` | String | `""` | Follow-up notes from admin/directorate |
| `state` | String | `"pending"` | Workflow state: `"pending"`, `"in_process"`, `"finalized"` |
| `category` | String? | `null` | Optional category code |
| `timestamp` | DateTime | — | When the incident occurred (set by teacher) |
| `createdAt` | DateTime | `now()` | Database record creation time |
| `updatedAt` | DateTime | auto | Last update time |
| `poolId` | String? | `null` | FK to CommunicationsPool (for bulk-created groups) |
| `sentiment` | String | `"neutral"` | Sentiment classification code |

**Unique constraint:** `[teacherEmail, studentEnrolment, subjectCode, timestamp, message]` — prevents exact duplicate communications.

#### CommunicationsPool

| Field | Type | Description |
|---|---|---|
| `id` | String (CUID) | Primary key |
| `communications` | Communication[] | All communications in this pool |

A pool groups communications that were created together in a single batch (e.g., teacher registers same incident for 5 students at once). This allows the detail view to show "also involved" students.

#### GlobalMetadata

| Field | Type | Description |
|---|---|---|
| `key` | String (CUID, @id) | Metadata key |
| `value` | String? | Metadata value |

Used as a generic key-value store for system metadata (e.g., `lastDailyReport`, `lastStudentSpecificDailyReport`, `lastAcumulativeReport`, and per-student cumulative alert counters).

#### Authentication Models (NextAuth standard)

- **User**: `id`, `name`, `email`, `emailVerified`, `image`
- **Account**: OAuth provider account data (Azure AD tokens)
- **Session**: Active sessions with expiration
- **VerificationToken**: Email verification tokens

### 4.2 JSON Configuration Data (on disk)

These files live at `SETTINGS_PATH` (default: `./.local/settings/`):

#### `teachers.json`
```json
[
  { "name": "Juan Pérez", "email": "jperez@henryford.edu.ar" },
  { "name": "María García", "email": "mgarcia@henryford.edu.ar" }
]
```
**Schema:** Array of `{ name: string, email: string(email) }`

#### `students.json`
```json
[
  {
    "name": "APELLIDO, Nombre",
    "enrolment": "12345",
    "motherEmail": "madre@email.com",
    "fatherEmail": "padre@email.com",
    "coursingYear": 3
  }
]
```
**Schema:** Array of `{ name: string, enrolment: string, motherEmail?: string, fatherEmail?: string, coursingYear: int(1-7) }`

Student names are typically stored in `"LASTNAME, Firstname"` format. The `transformName()` utility converts this to `"Firstname LASTNAME"` for display.

#### `subjects.json`
```json
[
  {
    "name": "Matemática",
    "code": "MAT3",
    "teachers": ["jperez@henryford.edu.ar"],
    "courseYear": 3
  }
]
```
**Schema:** Array of `{ name: string, code: string, teachers: string[], courseYear: int(1-7) }`

The `teachers` array contains email addresses of teachers assigned to that subject. A teacher can only create communications for subjects they are assigned to (unless they are admin, or `disableControlledAccess` is `true`).

#### `general.json`
```json
{
  "messages": [
    { "text": "No trajo los materiales", "sentiment": "negative" },
    { "text": "Participó activamente en clase", "sentiment": "positive" }
  ],
  "sentiments": [
    { "code": "positive", "color": "#4caf50", "name": "Positivo" },
    { "code": "negative", "color": "#f44336", "name": "Negativo" },
    { "code": "neutral", "color": "#000000", "name": "Neutral" }
  ],
  "categories": [
    { "name": "Convivencia", "code": "convivencia" },
    { "name": "Académico", "code": "academico" }
  ],
  "admins": ["admin@henryford.edu.ar"],
  "reportToEmails": ["directora@henryford.edu.ar", "preceptor@henryford.edu.ar"],
  "reeplacementSubject": false,
  "disableControlledAccess": false
}
```

**Schema:**

| Field | Type | Default | Description |
|---|---|---|---|
| `messages` | Array | — | Predefined communication reasons. Each has a `text` (displayed to teacher) and a `sentiment` code that maps to a color. **Legacy format:** plain strings (auto-converted to `{text, sentiment: "neutral"}`) |
| `sentiments` | Array | `[{code:"neutral", color:"black"}]` | Sentiment definitions with display color. Used to color-code messages in the UI |
| `categories` | Array | `[]` | Communication categories for classification |
| `admins` | String[]? | `[]` | Email addresses of admin users |
| `reportToEmails` | String[]? | `[]` | Email addresses that receive automated reports |
| `reeplacementSubject` | boolean | `false` | When `true`, generates virtual "Replacement" subjects for all courses (see Section 7.2) |
| `disableControlledAccess` | boolean | `false` | When `true`, all teachers can see all subjects (ignoring teacher-subject assignments). When `false`, teachers only see their assigned subjects |

### 4.3 Settings Class Internal Cache

The `Settings` class (`src/settings.mjs`) builds in-memory lookup maps on data import for O(1) lookups:

| Map | Key | Value | Purpose |
|---|---|---|---|
| `_studentsByEnrolment` | enrolment (lowercase) | Student object | Fast student lookup by enrollment |
| `_teachersByEmail` | email | Teacher object | Fast teacher lookup by email |
| `_subjectsByCode` | subject code | Subject object | Fast subject lookup by code |
| `_subjectsByTeacher` | teacher email | Set of subject codes | All subjects a teacher teaches |

**Auto-import behavior:** In production, data is imported once and cached. In development (`NODE_ENV === 'development'`), data is re-imported on every access (to pick up file changes without restart).

---

## 5. Authentication & Authorization

### 5.1 Authentication Provider

The system uses **NextAuth.js** with **Azure Active Directory** as the sole identity provider. This means:
- Only users with school Azure AD accounts can log in
- Authentication uses OAuth2 flow via Microsoft Azure AD
- Session data is stored in the SQLite database via Prisma adapter

**Configuration (env vars):**
- `AZUREAD_CLIENT_ID` — Azure AD application ID
- `AZUREAD_CLIENT_SECRET` — Azure AD application secret
- `AZUREAD_TENANT_ID` — Azure AD tenant ID
- `NEXTAUTH_SECRET` — Session signing secret
- `NEXTAUTH_URL` — Application base URL

### 5.2 Session Structure

The session is extended to include the user's `id`:
```typescript
interface Session {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  }
}
```

### 5.3 Route Protection

The `ProtectedRoute` component wraps all pages and enforces:

1. **Authentication check:** User must be signed in. If not, a sign-in screen with Azure AD button is shown.
2. **Role check (optional):**
   - `requiredAdmin={true}` — Only admins can access (used for Settings page)
   - `requiredTeacher={true}` — Only teachers can access

If the user is authenticated but lacks the required role, a "No tienes permiso para acceder a esta página" (You don't have permission to access this page) screen is displayed.

**Rendering states:**
- **Loading** → spinner
- **Unauthenticated** → sign-in screen
- **Authenticated but unauthorized** → "not allowed" screen
- **Authenticated and authorized** → page content

### 5.4 API-Level Protection

All tRPC procedures use `protectedProcedure` which enforces authentication via middleware. The middleware checks `ctx.session` and throws `UNAUTHORIZED` if no session exists.

Individual procedures perform additional role checks:
- `saveFile`, `getFile` → checks `isAdmin`
- `updateCommunicationFollowUp` → checks `isAdmin` (throws `FORBIDDEN` if not)
- `createCommunications` → checks `isTeacher`
- `getCommunications` → restricts non-admins to their own communications
- `deleteCommunications` → non-admins can only delete within 7 days

---

## 6. Role System

Roles are determined at runtime by matching the authenticated user's email against configuration data:

### 6.1 Role Determination

```javascript
getUserRole(email) {
    isTeacher = email exists in teachers.json
    isAdmin = email is in general.json.admins array
}
```

A user can be **both** a teacher and an admin.

### 6.2 Role Capabilities Matrix

| Capability | Teacher (non-admin) | Admin |
|---|---|---|
| View home page | Yes | Yes |
| Create communications | Yes (own subjects only*) | Yes (all subjects) |
| View communications list | Yes (own only) | Yes (all) |
| View communication detail | Yes (own only) | Yes (all) |
| Edit follow-up & state | No | Yes |
| Edit category | No | Yes |
| Delete communications | Yes (own, within 7 days) | Yes (any, anytime) |
| Access settings page | No | Yes |
| Edit JSON config files | No | Yes |
| Search/filter communications | Yes (own scope) | Yes (all scope) |

*\*Unless `disableControlledAccess` is `true`, in which case all teachers see all subjects.*

### 6.3 The `useUserRole()` Hook

```typescript
const { isTeacher, isAdmin, isLoading } = useUserRole()
```

Used throughout the frontend to conditionally render UI elements (e.g., delete button, settings link, filter options).

---

## 7. Configuration System (Settings)

### 7.1 How Configuration Works

1. Configuration is stored as **4 JSON files** on disk (`SETTINGS_PATH`): `general.json`, `teachers.json`, `subjects.json`, `students.json`
2. The `Settings` class reads, validates (Zod), and caches this data in memory
3. Admins can edit these files through the **Settings page** using a Monaco JSON editor
4. When a file is saved:
   - It is validated against its Zod schema
   - If validation passes, it is written to disk
   - `importData()` is called to refresh the in-memory cache
   - If validation fails, an error is returned and the file is NOT saved

### 7.2 Replacement Subjects Feature (`reeplacementSubject`)

When `general.json.reeplacementSubject` is `true`, the system auto-generates **virtual "replacement" subjects** for every course year:

```
Reemplazo 1° año (code: RPLZ1) — all teachers assigned
Reemplazo 2° año (code: RPLZ2) — all teachers assigned
...
Reemplazo 7° año (code: RPLZ7) — all teachers assigned
```

This allows **substitute/replacement teachers** to register communications even when they don't have a permanently assigned subject. Every teacher is assigned to every replacement subject.

### 7.3 Controlled Access Feature (`disableControlledAccess`)

- **When `false` (default):** Teachers can only create communications for subjects listed in `subjects.json` where their email appears in the `teachers` array. The subject picker in the "new communication" form only shows the teacher's assigned subjects.
- **When `true`:** Access restrictions are removed. Any teacher can create a communication for any subject. The `getSubjectsOfYear` API returns all subjects with all teacher emails, effectively giving every teacher access to every subject.

### 7.4 Messages & Sentiments

Messages are predefined communication reasons configured in `general.json.messages`. Each message maps to a **sentiment** code (e.g., "positive", "negative", "neutral"). Sentiments are defined in `general.json.sentiments` with a display color.

**How it works:**
1. Admin defines sentiments: `[{code: "positive", color: "#4caf50"}, {code: "negative", color: "#f44336"}]`
2. Admin defines messages: `[{text: "Disrupted class", sentiment: "negative"}, {text: "Excellent participation", sentiment: "positive"}]`
3. When a teacher creates a communication, they select a message from this predefined list
4. The message text is displayed in the sentiment's color throughout the UI
5. **Legacy support:** Old format (plain strings) is auto-converted to `{text: string, sentiment: "neutral"}`

### 7.5 Categories

Categories provide an optional classification system for communications (e.g., "Convivencia", "Académico"). They are:
- Defined in `general.json.categories` as `[{name, code}]`
- Optionally assigned when creating a communication
- Can be changed by admins in the detail view
- Available as a filter in the communications list

### 7.6 Admin Emails

The `general.json.admins` array contains email addresses of users who have admin privileges. This is the **sole mechanism** for granting admin access — there is no admin UI for promoting users; it must be edited in the JSON config.

### 7.7 Report Recipients

The `general.json.reportToEmails` array defines which email addresses receive automated report emails from the cron job.

---

## 8. Core Business Logic: Communications

### 8.1 Communication Lifecycle

```
[Teacher creates] → pending → [Admin reviews] → in_process → [Admin resolves] → finalized
```

**States:**
| State | Display | Color | Description |
|---|---|---|---|
| `pending` | Pendiente | Gray (#bbbbbb) | Newly created, not yet reviewed |
| `in_process` | En proceso | Yellow (#ffea00) | Being actively followed up |
| `finalized` | Finalizado | Green (#76ff03) | Case resolved/closed |

### 8.2 Creating a Communication

**Who:** Teachers (and admins who are also teachers)

**Process:**
1. Teacher selects a **course year** (1-7) — this filters available subjects and students
2. Teacher selects a **subject** — limited to subjects they teach (unless `disableControlledAccess` or admin)
3. Teacher selects one or more **students** from the course
4. Teacher sets the **date and time** of the incident
5. Teacher selects a **message** (reason) from the predefined list
6. Teacher optionally writes a **comment** (additional details)
7. Teacher writes the **pedagogical action taken** (required field)
8. Teacher optionally selects a **category**
9. Teacher clicks "Registrar" (Register)

**Validation rules (for non-admins, when controlled access is enabled):**
- Timestamp must not be more than **10 minutes in the future**
- Timestamp must not be more than **10 days in the past**
- Subject must exist in the system
- Teacher must be assigned to the subject
- Message is required
- Subject is required
- At least 1 student is required
- Pedagogical action taken is required

**Admins bypass:** timestamp validation and subject ownership validation.

**Bulk creation:**
- If multiple students are selected, a `CommunicationsPool` is created first
- One `Communication` record is created per student, all linked to the same pool
- All inserts happen in a single Prisma transaction
- This allows the detail view to show "also involved" students via the pool relation

**After creation:** The user is redirected to the communications list page with a date range filter set to the communication's timestamp.

### 8.3 Viewing Communications (List)

**Who:** Teachers see only their own communications. Admins see all communications.

**Data loading:**
- Communications are fetched from the database with applied filters
- Default time range: **start of current year to end of current year**
- Data is auto-refreshed every **60 seconds**
- Each communication is enriched with: student details, subject details, teacher details, sentiment color, and an `isMine` flag

**Columns displayed in the DataGrid:**

| Column | Field | Width | Notes |
|---|---|---|---|
| Matrícula (Enrollment) | `studentEnrolment` | 100px | |
| Nombre (Name) | `studentName` | 190px | Falls back to `<no encontrado>` |
| Materia (Subject) | `subjectName` | 210px | Format: `CODE - Name` |
| Mensaje (Message) | `message` | 350px | **Colored** by sentiment |
| Estado (State) | `state` | 60px | Colored dot indicator |
| Fecha (Date) | `date` | 100px | DD/MM/YYYY format |
| Hora (Time) | `time` | 60px | HH:mm format |
| Docente (Teacher) | `teacherName` | 130px | Teacher name or email fallback |
| Comentario (Comment) | `comment` | 300px | Teacher's additional comment |
| Acción pedagógica | `action_taken` | 300px | Teacher's pedagogical action |
| Seguimiento | `followup` | 300px | Admin's follow-up notes |
| ID | `id` | 20px | Hidden by default |

**Interactions:**
- **Double-click a row** → opens communication detail in new tab
- **Checkbox selection** → enables bulk actions
- **Single selection** → shows "Mostrar" (Open) button
- **Multiple selection** → shows selection count chip
- **Selection + Admin** → shows delete button with confirmation dialog
- **Column visibility** → can toggle columns on/off via DataGrid header menu

### 8.4 Viewing Communication Detail

**Who:** Teachers see only their own. Admins see all.

**Displayed information (read-only section):**
- Teacher name and email
- Timestamp (DD/MM/YY - HH:mm format)
- Subject code and name
- Student enrollment and name
- **Pool members:** If the communication was part of a bulk creation, shows chips for other involved students. Each chip is clickable and navigates to that student's communication.
- Message text (colored by sentiment)
- Teacher comment
- Teacher's pedagogical action taken

**Editable section (admin only):**
- **Follow-up text field** — multiline textarea for admin notes
- **State selector** — dropdown: Pendiente / En proceso / Finalizado (with colored dots)
- **Category selector** — dropdown of configured categories

**Actions:**
- **Save button** — appears only when there are unsaved changes (detected by comparing current state to fetched data). Highlighted with red text "*Tienes cambios sin guardar" (You have unsaved changes)
- **Delete button** — admin only. Deletes the communication and redirects to list.

**Error states:**
- Communication not found → "No se encontró la comunicación"
- Loading error → "Ocurrió un error al cargar la comunicación"

### 8.5 Deleting Communications

**Non-admins:**
- Can only delete their own communications (`teacherEmail` must match session email)
- Can only delete communications created within the last **7 days** (`createdAt >= now - 7 days`)

**Admins:**
- Can delete any communication, at any time
- Can bulk delete by selecting multiple rows in the DataGrid

**Confirmation:** A browser `confirm()` dialog asks "¿Está seguro que desea eliminar N comunicaciones?" before proceeding.

### 8.6 Updating Follow-Up (Admin Only)

Only admins can update the follow-up fields. The mutation updates three fields atomically:
- `followup` — text notes
- `state` — workflow state (pending/in_process/finalized)
- `category` — optional category code

Non-admins receive a `FORBIDDEN` tRPC error if they attempt this.

---

## 9. Views & Pages

### 9.1 Home Page (`/`)

**Route:** `src/pages/index.tsx`
**Access:** Authenticated users (teacher or admin)

A simple dashboard with large action buttons:
- **"Registrar nueva comunicación"** — shown to teachers and admins → navigates to `/nueva-comunicacion`
- **"Ver comunicaciones"** — shown to teachers and admins → navigates to `/comunicaciones`
- **"Configuración"** — shown to admins only → navigates to `/settings`

### 9.2 New Communication Page (`/nueva-comunicacion`)

**Route:** `src/pages/nueva-comunicacion.tsx`
**Access:** Authenticated users (teacher or admin)

**Layout:** Two-column form (responsive, collapses to single column on mobile)

**Left column:**
1. **Course selector** — dropdown of years 1° through 7°
2. **Subject selector** — dropdown filtered by selected course; only shows subjects the teacher is assigned to (or all if admin / disableControlledAccess)
3. **Student selector** — dropdown of students in the selected course; selecting adds student as a chip below
4. **Date picker** — constrained to `today - 10 days` through `today + 1 minute`
5. **Time picker** — if the selected date is today, time is constrained to not exceed current time + 1 minute

**Right column:**
1. **Message/Reason selector** — dropdown of predefined messages, each displayed in its sentiment color
2. **Comment text field** — optional freeform text (multiline, 2 rows)
3. **Pedagogical action text field** — required freeform text (multiline, 2 rows)
4. **Category selector** — optional dropdown of configured categories

**Bottom:**
- Selected students displayed as chips with avatar and delete (X) button
- Validation messages:
  - "Agregue al menos un estudiante" (Add at least one student) — when form is almost complete but no student selected
  - "Completar campos obligatorios (*)" — when all selected but required action_taken is missing
- **"Registrar" button** — disabled until all required fields are filled; shows "Registrando..." during submission

**URL query state:** Course (`curso`), subject (`materia`), and student enrollment (`matricula`) are persisted in URL query parameters via `next-usequerystate`.

### 9.3 Communications List Page (`/comunicaciones`)

**Route:** `src/pages/comunicaciones.tsx`
**Access:** Authenticated users (teacher or admin)

**Layout:** Full-screen DataGrid with bottom toolbar

**Top:** AppBar with search input
**Center:** MUI DataGrid filling the viewport (fixed positioning: top 60px to bottom)
**Bottom toolbar (desktop):** Filter chips + selection actions (left aligned, DataGrid pagination right aligned)
**Bottom toolbar (mobile):** Filter icon button (opens dialog) + selection actions

See Section 8.3 for DataGrid columns and Section 10 for the filtering system.

### 9.4 Communication Detail Page (`/comunicaciones/[id]`)

**Route:** `src/pages/comunicaciones/[id].tsx`
**Access:** Authenticated users (teachers see own only, admins see all)

See Section 8.4 for full details.

### 9.5 Settings Page (`/settings`)

**Route:** `src/pages/settings/index.tsx`
**Access:** Admin only (`requiredAdmin` prop on ProtectedRoute)

**Layout:** Tabbed interface with 4 tabs:

| Tab | Label | File | Description |
|---|---|---|---|
| 0 | General | `general.json` | Messages, sentiments, categories, admins, feature flags |
| 1 | Docentes | `teachers.json` | Teacher list (name + email) |
| 2 | Materias | `subjects.json` | Subject definitions (name, code, teachers, courseYear) |
| 3 | Estudiantes | `students.json` | Student list (name, enrollment, parent emails, year) |

Each tab contains a **Monaco editor** (full-featured code editor) configured for JSON with:
- Full auto-indentation
- Format on paste
- Format on type
- JSON syntax highlighting

**Saving:**
- **Ctrl+S keyboard shortcut** — triggers save
- **"Guardar" button** (bottom-right corner) — triggers save
- On save: file content is sent to the server, validated against the Zod schema, written to disk, and data is re-imported
- On success: `alert("Guardado correctamente")`
- On error: Dialog with error message "Ocurrió un error al guardar, revise el formato"

### 9.6 AppBar Component

Present on all pages. Features:
- **Menu icon** (hamburger) — opens left drawer
- **Search input** (optional, shown on communications list page) — full-text search
- **User avatar** (shown when no search) — displays user initials with consistent color

**Drawer menu:**
- User profile section with avatar, name, email, and admin badge (if applicable)
- Navigation links:
  - Inicio (Home) → `/`
  - Comunicaciones → `/comunicaciones`
  - Nueva comunicación → `/nueva-comunicacion`
  - Configuración → `/settings` (admin only)
- Sign out button

---

## 10. Filtering System

### 10.1 Architecture

Filters are managed by the `useFilters()` hook (`src/lib/useFilters.ts`) which persists filter state in **URL query parameters** via `next-usequerystate`. This means:
- Filter state survives page refreshes
- Filters can be shared via URL
- Browser back/forward navigation works with filters

### 10.2 Available Filters

| Filter | URL Param | Type | Description |
|---|---|---|---|
| Date Range | `dateRange` | `"start..end"` (timestamps) | Start and end dates |
| Course | `course` | Number | Academic year (1-7) |
| Subject | `subject` | String | Subject code |
| Student | `student` | String | Student enrollment |
| Teacher | `teacher` | String | Teacher email |
| Category | `category` | String | Category code |

**Additionally:** A **text search filter** (not URL-persisted) performs client-side full-text search across all communication fields with **diacritic normalization** (accent-insensitive search using NFD Unicode normalization).

### 10.3 Filter UI (Chips)

Each filter appears as a **chip** in the bottom toolbar:
- **Inactive filter:** shows `+` icon with label (e.g., `+ Fecha`)
- **Active filter:** shows appropriate icon + current value (e.g., `📅 01/01/2024 - 31/01/2024`)
- **Click chip:** opens picker dialog
- **Click X on chip:** clears that filter

### 10.4 Filter Pickers

Each filter has a dialog-based picker:

**Date Range picker:**
- Two date pickers: "Mostrar desde" (from) and "Mostrar hasta" (to)
- Quick presets:
  - Hoy (Today)
  - Ayer (Yesterday)
  - Este mes (This month)
  - Mes pasado (Last month)
  - Primer cuatrimestre (First semester: Mar 1 - Jul 31)
  - Segundo cuatrimestre (Second semester: Aug 1 - Dec 31)
- "Borrar" (Clear) button to remove the date filter
- Note: Semester dates are currently hardcoded to 2022 dates

**Course picker:**
- List of years 1° through 7° ("`N°` año")

**Subject picker:**
- List of subjects filtered by selected course (if course filter is active)
- Non-admins see only their assigned subjects; admins see all

**Student picker:**
- List of students filtered by course (if course filter active)
- **Only shows students who have at least one communication** in the current result set (via `studentShouldBeVisible` callback that checks `communicationsByStudent`)
- Each student shows: avatar with initials, name, enrollment number, and year

**Teacher picker:**
- List of all teachers with avatar and email

**Category picker:**
- List of configured categories (name and code)

### 10.5 Server-Side Filtering

The `getCommunications` API applies these filters at the database level:
- `teacherEmail`: restricted to current user for non-admins (or specific teacher if admin filters by teacher)
- `timestamp.gte / timestamp.lte`: date range (defaults to current year if no filter)
- `studentEnrolment`: exact match
- `subjectCode`: exact match
- `category`: exact match

**Course filtering** is done client-side after fetching (post-filter on `subject.courseYear`).

### 10.6 Text Search (Client-Side)

The text search operates on a concatenated string of all communication fields:
```
studentEnrolment + message + action_taken + teacher.name + comment + subjectCode + student.name + studentEnrolment + subject.name
```

It uses **NFD Unicode normalization** to remove diacritical marks, making the search accent-insensitive (e.g., searching "garcia" matches "García").

---

## 11. Automated Reports & Alerts (Cron)

### 11.1 Cron Job Architecture

A separate Node.js process (`src/cron.mjs`) runs alongside the Next.js server. It creates a `CronJob` that periodically hits the `/api/cron` endpoint.

**Default schedule:** `0 0 8,15 * * 1-5` — At 8:00 AM and 3:00 PM, Monday through Friday (configurable via `CRON_JOB_SCHEDULE` env var).

**Security:** The cron endpoint requires a Bearer token in the `Authorization` header matching `CRON_JOB_TOKEN` (or `NEXTAUTH_SECRET` as fallback).

**Enable/disable:** Reports are only sent if `DAILY_REPORTS` env var is set to `true`, `on`, or `yes`.

### 11.2 Email Configuration

Emails are sent via **Nodemailer** with SMTP:

| Env Var | Default | Description |
|---|---|---|
| `SMTP_HOST` | — | SMTP server host |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USE_SSL` | `false` | Enable SSL (`true`/`on`/`yes`) |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM_EMAIL` | `SMTP_USER` | Sender email address |
| `SMTP_FROM_NAME` | `SMTP_USER` or `"Reportes"` | Sender display name |
| `NODEMAILER_SMTP_SERVICE` | `Outlook365` | Nodemailer service preset |

Emails are sent to all addresses in `general.json.reportToEmails`.

### 11.3 Report Type 1: Daily Report

**Function:** `getDailyReportEmail()`

**Trigger:** Every cron run (if there are new communications)

**Logic:**
1. Read `lastDailyReport` timestamp from GlobalMetadata
2. Fetch all communications with `timestamp >= lastDailyReport` (or today's start if no previous report)
3. If no communications found → skip (return null)
4. If communications found → generate HTML email with all communications
5. After sending → update `lastDailyReport` metadata to current time

**Subject:** `"Reporte diario de comunicaciones"`

**Content:** HTML document showing:
- Header: "Se han registrado N comunicaciones el día DD/MM/YYYY"
- List of communications with: teacher name → student enrollment - student name, message → pedagogical action, comment, year and subject code
- Each communication links to `https://comunicaciones.henryford.edu.ar/comunicaciones/{id}`

### 11.4 Report Type 2: Weekly Student-Specific Alerts

**Function:** `getWeeklyStudentSpecificReports()`

**Trigger:** Every cron run

**Purpose:** Alert when a student accumulates **3 or more communications in a single week**

**Logic:**
1. Read `lastStudentSpecificDailyReport` timestamp from GlobalMetadata
2. Determine the start of the current week
3. Fetch communications from the more recent of: start of week, or last report time
4. Group communications by student enrollment
5. For each student with **3+ communications:**
   - Count how many communications occurred before the last report
   - **Anti-duplication:** If 3+ communications existed before the last report AND total is less than 6, skip (already alerted)
   - If threshold crossed → generate alert email
6. After sending all → update `lastStudentSpecificDailyReport` metadata

**Subject:** `"Segunda alerta: N comunicaciones de {enrollment}"`

**Content:** HTML with:
- Header: "Alerta N comunicaciones de {enrollment}"
- Body: "El estudiante {enrollment} registró N comunicaciones en la última semana al día DD/MM/YYYY"
- Full list of the student's communications

**Anti-duplication logic detail:**
- If a student had 3+ communications already sent in a previous report, the alert won't fire again unless they reach 6+ total (i.e., 3 more since the last alert)

### 11.5 Report Type 3: Cumulative Annual Alerts

**Function:** `acumulativeReport()`

**Trigger:** Every cron run

**Purpose:** Alert when a student accumulates **3 or more communications with the same message type** across the entire school year

**Logic:**
1. Read `lastAcumulativeReport` timestamp from GlobalMetadata
2. Fetch ALL communications for the current year (from January 1st)
3. Group by student enrollment
4. For each student, group by message text
5. For each student-message combination:
   - Read metadata key `lastAcumulativeReport-{year}-{student}-{message}` → number of communications already alerted
   - If `(current count - already alerted) >= 3` → send alert, update metadata with current count
6. After sending all → update `lastAcumulativeReport` metadata

**Subject:** `"Alerta acumulativa: N comunicaciones de {enrollment}"`

**Content:** HTML with:
- Header: "Alerta acumulativa N comunicaciones de {enrollment}"
- Body: "El estudiante {enrollment} registró N comunicaciones en el año YYYY con el mismo mensaje"
- The specific message text (in a code block)
- Full list of all communications from that student with that message

**Key behavior:** The alert fires every time 3 additional communications of the same type accumulate. For example:
- 3 communications → first alert (metadata set to 3)
- 5 communications → no alert (5-3=2, less than 3)
- 6 communications → second alert (6-3=3, metadata set to 6)
- 8 communications → no alert (8-6=2)
- 9 communications → third alert (9-6=3, metadata set to 9)

### 11.6 Email HTML Template

The `getReportContent()` function in `src/lib/reports/reports.tsx` generates HTML emails using React server-side rendering. Each communication in the email shows:
- Teacher name → Student enrollment - Student name (bold, 18px)
- Message → Pedagogical action taken
- Comment (14px)
- Course year and subject code (14px)
- Alternating row backgrounds (light gray stripes)
- Each row is a clickable link to the communication detail page

---

## 12. API Endpoints (tRPC)

All endpoints are defined in `src/server/api/root.ts`. All are **protected** (require authentication).

### 12.1 Read Operations (Queries)

| Endpoint | Input | Returns | Access |
|---|---|---|---|
| `getCourses` | — | `[{year, label}]` for years 1-7 | All |
| `getAllSubjects` | — | All subjects | All |
| `getStudentsOf` | `number` (year) | Students in that year | All |
| `getAllStudents` | — | All students | All |
| `getStudent` | `string` (enrollment) | Single student | All |
| `getMySubjects` | — | Subjects of current user | All |
| `getSubjectsOfYear` | `number` (year) | Subjects in year* | All |
| `getSubject` | `string` (code) | Single subject | All |
| `getMessages` | — | Messages with sentiment colors | All |
| `getCategories` | — | Category list | All |
| `getUserRole` | — | `{isTeacher, isAdmin}` for current user | All |
| `getTeachers` | — | All teachers | All |
| `getCommunications` | Filter object (optional) | Enriched communications | Scoped** |
| `getCommunication` | `string` (id) | Single enriched communication with pool | Scoped** |
| `getFile` | `string` (filename) | File content as string | Admin only |

*`getSubjectsOfYear`: When `disableControlledAccess` is true, returns all subjects with all teachers listed.

**Scoped: Non-admins see only their own communications. Admins see all (or can filter by teacher).

### 12.2 Write Operations (Mutations)

| Endpoint | Input | Effect | Access |
|---|---|---|---|
| `createCommunications` | Array of communication objects | Creates communications (with pool if >1) | Teachers |
| `deleteCommunications` | Array of IDs | Deletes communications | Scoped*** |
| `updateCommunicationFollowUp` | `{id, followUp, state, category}` | Updates follow-up, state, category | Admin only |
| `saveFile` | `{filename, content}` | Validates, saves config file, re-imports data | Admin only |

***Scoped: Non-admins can only delete own communications within 7 days. Admins can delete any.

### 12.3 Input Validation

**Filename validation:** Both `getFile` and `saveFile` validate filenames against regex `^([a-zA-Z0-9\_\-]+\.)*[a-zA-Z0-9\_\-]+$` to prevent path traversal attacks.

**File content validation:** `saveFile` validates JSON content against the appropriate Zod schema based on filename (`teachers.json` → teacherSchema array, etc.). Only the 4 known filenames are accepted; any other filename results in "Invalid file name" error.

**Communication creation validation:**
- Array of objects, each with: `subject`, `message`, `comment`, `action_taken`, `student`, `timestamp`, optional `category`
- For non-admins (with controlled access): timestamp range check (±10 min future / 10 days past), subject existence check, subject ownership check

**Follow-up update validation:**
- State must be exactly one of: `"pending"`, `"in_process"`, `"finalized"` (Zod literal union)
- Category is nullable/optional string

---

## 13. Deployment

### 13.1 Docker

The application ships with a `Dockerfile`:

```dockerfile
FROM node:16-alpine3.17
ENV NODE_ENV production
ENV DATABASE_URL file:/database/db.sqlite
ENV SETTINGS_PATH /settings
ENV DATA_PATH /data
```

**Volumes:**
- `/database/` — SQLite database file
- `/settings/` — JSON configuration files
- `/data/` — Application data

**Startup:** `npx prisma migrate deploy && npm run start`

### 13.2 Environment Variables Summary

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite connection string (e.g., `file:./db.sqlite`) |
| `NEXTAUTH_URL` | Yes | App base URL |
| `NEXTAUTH_SECRET` | Yes (prod) | Session signing secret |
| `AZUREAD_CLIENT_ID` | Yes | Azure AD app ID |
| `AZUREAD_CLIENT_SECRET` | Yes | Azure AD app secret |
| `AZUREAD_TENANT_ID` | Yes | Azure AD tenant ID |
| `SETTINGS_PATH` | No | Path to JSON config files (default: `./.local/settings`) |
| `DATA_PATH` | No | Path to data directory (default: `./.local/data`) |
| `CRON_JOB_TOKEN` | No | Token for cron endpoint auth (default: NEXTAUTH_SECRET) |
| `CRON_JOB_SCHEDULE` | No | Cron schedule expression (default: `0 0 8,15 * * 1-5`) |
| `DAILY_REPORTS` | No | Enable email reports: `true`/`on`/`yes` |
| `SMTP_HOST` | No* | SMTP server host |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USE_SSL` | No | Enable SSL (default: false) |
| `SMTP_USER` | No* | SMTP username |
| `SMTP_PASS` | No* | SMTP password |
| `SMTP_FROM_EMAIL` | No | Sender email (default: SMTP_USER) |
| `SMTP_FROM_NAME` | No | Sender name (default: SMTP_USER or "Reportes") |
| `NODEMAILER_SMTP_SERVICE` | No | Nodemailer service (default: Outlook365) |

*Required if `DAILY_REPORTS` is enabled.

### 13.3 Build Configuration

- TypeScript build errors are **ignored** (`ignoreBuildErrors: true` in next.config)
- ESLint errors are **ignored** during build (`ignoreDuringBuilds: true`)
- React Strict Mode is **enabled**
- SWC minification is **enabled**
- i18n locale: `en` (despite the Spanish UI)

---

## Appendix: Utility Functions

### Name Utilities (`src/lib/util/nameUtils.ts`)

| Function | Input | Output | Purpose |
|---|---|---|---|
| `nameInitials(name)` | `"Juan Pérez"` | `"JP"` | Extract 1-2 initials from a name |
| `transformName(name)` | `"PÉREZ, Juan"` | `"Juan PÉREZ"` | Convert "LAST, First" to "First LAST" format |
| `stringToColor(string)` | `"Juan Pérez"` | `"#a3f2c1"` | Deterministic color hash for avatars |
| `stringAvatar(name)` | `"Juan Pérez"` | `{sx: {bgcolor}, children}` | MUI Avatar props from name |

### Metadata Service (`src/lib/metadata.ts`)

A thin wrapper around the `GlobalMetadata` Prisma model providing:
- `get(key)` → string or null
- `getAsInt(key)` → number or null
- `set(key, value)` → upsert string
- `setInt(key, value)` → upsert number (as string)
- `removeKey(key)` → delete
- `clearAll()` → delete all metadata
