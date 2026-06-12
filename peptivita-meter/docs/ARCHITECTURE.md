# 🏗️ Arquitectura y Guía de Despliegue — Peptivita Meter

## Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                 │
│         Next.js 14 + TypeScript + Tailwind CSS       │
│              Recharts · Lucide Icons                 │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────┐
│                  VERCEL (Edge/Serverless)             │
│         Next.js App Router · API Routes              │
│           Entorno: Node 20 · Region: GRU             │
└───────────────────────┬─────────────────────────────┘
                        │ REST / Realtime / Storage
┌───────────────────────▼─────────────────────────────┐
│                 SUPABASE (Backend-as-a-Service)       │
│  ┌──────────────┐ ┌────────────┐ ┌────────────────┐ │
│  │  PostgreSQL  │ │    Auth    │ │    Storage     │ │
│  │  (16+ rows) │ │ (JWT/RLS)  │ │ (Fotos progr.) │ │
│  └──────────────┘ └────────────┘ └────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Flujo de Autenticación

```
PACIENTE:
  Login (cédula + contraseña)
      ↓
  supabase.auth.signInWithPassword({
    email: `{cedula}@peptivita.local`,
    password: <contraseña>
  })
      ↓
  JWT almacenado en browser session
      ↓
  RLS aplica: solo ve sus propios datos

MODERADOR:
  Login (email + contraseña)
      ↓
  supabase.auth.signInWithPassword({...})
      ↓
  Verificación en tabla `moderators`
      ↓
  Acceso total a todos los pacientes
```

## Estructura de Carpetas

```
peptivita-meter/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD → Vercel automático
│
├── database/
│   └── 001_schema.sql          # Todo el esquema PostgreSQL
│
├── docs/
│   └── ARCHITECTURE.md         # Este archivo
│
├── frontend/                   # Next.js App
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── create-patient-auth/
│   │   │   │       └── route.ts      # Crear auth de paciente (server-side)
│   │   │   ├── globals.css           # Variables CSS del tema
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx              # Entry point → RoleSelector
│   │   │
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── RoleSelector.tsx  # Pantalla de selección inicial
│   │   │   │   ├── PatientLogin.tsx  # Login paciente (cédula)
│   │   │   │   └── ModeratorLogin.tsx
│   │   │   │
│   │   │   ├── moderator/
│   │   │   │   ├── ModeratorPanel.tsx     # Panel principal + búsqueda
│   │   │   │   ├── ConsultationForm.tsx   # Formulario completo de consulta
│   │   │   │   └── NewPatientForm.tsx     # Registro de nuevos pacientes
│   │   │   │
│   │   │   └── patient/
│   │   │       └── PatientDashboard.tsx   # Dashboard completo del paciente
│   │   │
│   │   └── lib/
│   │       └── supabase.ts          # Cliente Supabase + tipos + helpers
│   │
│   ├── .env.example
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── README.md
```

## Despliegue Paso a Paso

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. En el SQL Editor, ejecutar `database/001_schema.sql`
3. En Storage, crear bucket llamado `progress-photos` (público)
4. Copiar las claves: `Project URL`, `anon key`, `service_role key`

### 2. Desplegar en Vercel

```bash
# Opción A: CLI
npm i -g vercel
cd frontend
vercel --prod

# Opción B: GitHub
# Conectar repositorio en vercel.com → Import Project
# Root directory: frontend
```

#### Variables de entorno en Vercel:
```
NEXT_PUBLIC_SUPABASE_URL        = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJh...
SUPABASE_SERVICE_ROLE_KEY       = eyJh...  (solo backend)
```

### 3. Configurar CI/CD (GitHub Actions)

En tu repositorio GitHub → Settings → Secrets:
```
VERCEL_TOKEN       → Obtener en vercel.com/account/tokens
VERCEL_ORG_ID      → En .vercel/project.json tras primer deploy
VERCEL_PROJECT_ID  → En .vercel/project.json tras primer deploy
```

### 4. Crear primer moderador

En Supabase Authentication → Add user:
- Email: tu-email@clinica.com
- Password: (segura)

Luego en SQL Editor:
```sql
INSERT INTO moderators (supabase_uid, full_name, email, role)
VALUES (
  '<UID del usuario creado>',
  'Dr. Nombre Apellido',
  'tu-email@clinica.com',
  'admin'
);
```

## Seguridad

- **RLS activo** en todas las tablas sensibles
- **Service Role Key** nunca expuesta al cliente (solo en API routes server-side)
- **HTTPS** obligatorio en Vercel
- **JWT** de Supabase con expiración configurable
- **Contraseña inicial** del paciente = su cédula → se recomienda forzar cambio en primer login

## Variables calculadas automáticamente (PostgreSQL)

| Campo | Cálculo |
|-------|---------|
| `bmi` | `weight_kg / (height_cm/100)²` |
| `waist_hip_ratio` | `waist_cm / hip_cm` |
| `classification` (labs) | Comparación con `ref_min`/`ref_max` |

## KPIs calculados en Frontend

| KPI | Fórmula |
|-----|---------|
| % Peso perdido | `(inicial - actual) / inicial × 100` |
| Progreso a meta | `(inicial - actual) / (inicial - meta) × 100` |
| Clasificación ICC | Según OMS por género |
| Constitución ósea | Relación Altura / Muñeca (Método de Frame Size) |
