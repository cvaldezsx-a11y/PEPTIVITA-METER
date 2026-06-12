'use client'

import { useState } from 'react'
import PatientLogin from './PatientLogin'
import ModeratorLogin from './ModeratorLogin'

export default function RoleSelector() {
  const [role, setRole] = useState<'patient' | 'moderator' | null>(null)

  if (role === 'patient')   return <PatientLogin onBack={() => setRole(null)} />
  if (role === 'moderator') return <ModeratorLogin onBack={() => setRole(null)} />

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ECG Background SVG */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.06 }}
        viewBox="0 0 1200 400" preserveAspectRatio="none"
      >
        <polyline
          className="ecg-line"
          points="0,200 100,200 120,200 140,80 160,320 180,200 220,200 240,160 260,240 280,200 400,200 420,200 440,50 460,350 480,200 550,200 600,200 620,170 640,230 660,200 800,200 820,200 840,60 860,340 880,200 1000,200 1020,180 1040,220 1060,200 1200,200"
          fill="none"
          stroke="var(--cyan)"
          strokeWidth="2"
        />
      </svg>

      {/* Logo + Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, var(--cyan), var(--green))',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
          }}>🧬</div>
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}>Peptivita Meter</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: 0 }}>
          Plataforma de seguimiento clínico y optimización
        </p>
      </div>

      {/* Role Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        width: '100%',
        maxWidth: '600px',
        zIndex: 1,
      }}>
        <RoleCard
          emoji="👤"
          title="Paciente"
          description="Consulta tu progreso, analíticas y tratamiento activo"
          accentColor="var(--green)"
          dimColor="var(--green-dim)"
          onClick={() => setRole('patient')}
        />
        <RoleCard
          emoji="⚕️"
          title="Moderador"
          description="Gestión de pacientes, ingreso de datos y reportes"
          accentColor="var(--cyan)"
          dimColor="var(--cyan-dim)"
          onClick={() => setRole('moderator')}
        />
      </div>

      <p style={{
        marginTop: '40px',
        color: 'var(--text-muted)',
        fontSize: '12px',
        zIndex: 1,
      }}>
        Datos médicos protegidos · Acceso seguro por rol
      </p>
    </div>
  )
}

function RoleCard({
  emoji, title, description, accentColor, dimColor, onClick
}: {
  emoji: string
  title: string
  description: string
  accentColor: string
  dimColor: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? dimColor : 'var(--bg-card)',
        border: `1px solid ${hovered ? accentColor : 'var(--border)'}`,
        borderRadius: '16px',
        padding: '32px 24px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 12px 40px ${dimColor}` : 'none',
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '16px' }}>{emoji}</div>
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '20px',
        fontWeight: 700,
        color: hovered ? accentColor : 'var(--text-primary)',
        marginBottom: '8px',
        transition: 'color 0.2s',
      }}>{title}</div>
      <div style={{
        fontSize: '14px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
      }}>{description}</div>
      <div style={{
        marginTop: '20px',
        color: accentColor,
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        Ingresar →
      </div>
    </button>
  )
}
