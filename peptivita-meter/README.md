# 🧬 Peptivita Meter

> Plataforma clínica para el seguimiento antropométrico, metabólico y de optimización mediante péptidos.

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USER/peptivita-meter)

---

## 📋 Descripción

**Peptivita Meter** es una aplicación web médica que permite a especialistas y pacientes llevar un seguimiento integral de:

- 📏 Mediciones antropométricas y composición corporal
- 💉 Protocolos de péptidos terapéuticos
- 🧪 Analíticas de laboratorio con clasificación automática
- 📸 Galería fotográfica de progreso
- 📊 KPIs calculados automáticamente (ICC, constitución ósea, % pérdida de peso)

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Backend/BDD | Supabase (PostgreSQL + Auth + Storage) |
| Despliegue | Vercel (Frontend) + Supabase Cloud |
| CI/CD | GitHub Actions |

---

## 🚀 Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/YOUR_USER/peptivita-meter.git
cd peptivita-meter

# 2. Instalar dependencias
cd frontend && npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# 4. Correr migraciones de base de datos
# Ejecutar los archivos SQL en /database/ en Supabase SQL Editor

# 5. Iniciar en desarrollo
npm run dev
```

---

## 📁 Estructura del Proyecto

```
peptivita-meter/
├── frontend/          # Next.js App
│   └── src/
│       ├── app/       # Rutas (App Router)
│       ├── components/# Componentes React
│       ├── hooks/     # Custom hooks
│       └── lib/       # Supabase client, utils
├── database/          # Migraciones SQL
├── docs/              # Documentación adicional
└── .github/workflows/ # CI/CD
```

---

## 🔐 Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx  # Solo backend/server
```

---

## 👥 Roles

| Rol | Acceso |
|-----|--------|
| **Moderador** | Ingreso de datos, gestión de pacientes, visualización total |
| **Paciente** | Dashboard personal de solo lectura |

---

## 📄 Licencia

MIT — Uso clínico bajo responsabilidad del profesional médico tratante.
