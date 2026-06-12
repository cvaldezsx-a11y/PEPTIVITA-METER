'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, type Patient } from '@/lib/supabase'
import ConsultationForm from './ConsultationForm'
import ConsultationHistory from './ConsultationHistory'
import NewPatientForm from './NewPatientForm'

type View = 'search' | 'new-patient' | 'consultation' | 'history' | 'history' | 'history'

export default function ModeratorPanel({
  moderator, onLogout
}: {
  moderator: any
  onLogout: () => void
}) {
  const [view, setView] = useState<View>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null)
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)

  useEffect(() => { loadAllPatients() }, [])

  async function loadAllPatients() {
    setLoadingPatients(true)
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
    if (data) setAllPatients(data)
    setLoadingPatients(false)
  }

  // Filtro en tiempo real por nombre O cédula
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allPatients
    return allPatients.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      p.cedula.includes(q)
    )
  }, [searchQuery, allPatients])

  // Agrupar por letra inicial
  const groupedPatients = useMemo(() => {
    const groups: Record<string, Patient[]> = {}
    filteredPatients.forEach(p => {
      const letter = p.full_name[0].toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(p)
    })
    return groups
  }, [filteredPatients])

  const alphabet = Object.keys(groupedPatients).sort()

  function selectPatient(p: Patient) {
    setFoundPatient(p)
    setView('history')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-deep)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', minWidth: '240px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <span style={{ fontSize: '22px' }}>🧬</span>
          <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '16px' }}>Peptivita</span>
        </div>

        <nav style={{ flex: 1 }}>
          {[
            { id: 'search',      icon: '🔍', label: 'Pacientes' },
            { id: 'new-patient', icon: '➕', label: 'Nuevo Paciente' },
          ].map(item => (
            <button key={item.id}
              onClick={() => { setView(item.id as View); setFoundPatient(null) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: view === item.id ? 'var(--cyan-dim)' : 'transparent',
                color: view === item.id ? 'var(--cyan)' : 'var(--text-secondary)',
                fontSize: '14px', fontWeight: view === item.id ? 600 : 400,
                marginBottom: '4px', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {moderator.full_name}
          </div>
          <button onClick={onLogout} className="btn-ghost" style={{ width: '100%', padding: '8px', fontSize: '13px' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>

        {/* ── NUEVO PACIENTE ── */}
        {view === 'new-patient' && (
          <NewPatientForm
            moderatorId={moderator.id}
            onSuccess={(p) => { selectPatient(p) }}
          />
        )}

        {/* ── LISTA / CONSULTA ── */}
        {(view === 'search' || view === 'consultation') && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontFamily: 'DM Sans', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
                  {view === 'consultation' && foundPatient
                    ? `Consulta — ${foundPatient.full_name}`
                    : 'Pacientes'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                  {view === 'consultation' && foundPatient
                    ? `Cédula: ${foundPatient.cedula}`
                    : `${allPatients.length} pacientes registrados`}
                </p>
              </div>
              {view === 'consultation' && foundPatient && (
                <button
                  className="btn-ghost"
                  onClick={() => { setFoundPatient(null); setView('search') }}
                  style={{ fontSize: '13px' }}
                >
                  ← Volver a Pacientes
                </button>
              )}
            </div>

            {/* ── BUSCADOR ── */}
            {view === 'search' && (
              <div>
                <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '480px' }}>
                  <span style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '16px', pointerEvents: 'none',
                  }}>🔍</span>
                  <input
                    className="input-dark"
                    style={{ paddingLeft: '38px', fontSize: '15px' }}
                    placeholder="Buscar por nombre o cédula..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '18px', lineHeight: 1,
                      }}
                    >×</button>
                  )}
                </div>

                {loadingPatients ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Cargando pacientes...</div>
                ) : filteredPatients.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '48px 24px',
                    color: 'var(--text-secondary)',
                  }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                      No se encontró "{searchQuery}"
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => setView('new-patient')}
                      style={{ marginTop: '8px', fontSize: '13px' }}
                    >
                      + Registrar nuevo paciente
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Resultado count cuando hay búsqueda */}
                    {searchQuery && (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        {filteredPatients.length} resultado{filteredPatients.length !== 1 ? 's' : ''} para "{searchQuery}"
                      </div>
                    )}

                    {/* Lista agrupada por letra */}
                    {alphabet.map(letter => (
                      <div key={letter} style={{ marginBottom: '20px' }}>
                        {/* Letra del alfabeto */}
                        <div style={{
                          fontSize: '12px', fontWeight: 700, color: 'var(--cyan)',
                          letterSpacing: '1px', marginBottom: '8px',
                          paddingBottom: '6px', borderBottom: '1px solid var(--border)',
                        }}>
                          {letter}
                        </div>

                        {/* Pacientes de esa letra */}
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {groupedPatients[letter].map(p => (
                            <PatientRow
                              key={p.id}
                              patient={p}
                              searchQuery={searchQuery}
                              onClick={() => selectPatient(p)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── FORMULARIO DE CONSULTA ── */}
            {view === 'consultation' && foundPatient && (
              <div>
                {/* Sub-tabs nueva consulta / historial */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  {[
                    { id: 'consultation', label: '+ Nueva Consulta', icon: '📝' },
                    { id: 'history',      label: 'Ver Historial',    icon: '📋' },
                  ].map(t => (
                    <button key={t.id}
                      onClick={() => setView(t.id as View)}
                      style={{
                        padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontSize: '14px', fontWeight: 600,
                        background: view === t.id ? 'var(--cyan-dim)' : 'var(--bg-card)',
                        color: view === t.id ? 'var(--cyan)' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >{t.icon} {t.label}</button>
                  ))}
                </div>
                <ConsultationForm patient={foundPatient} moderatorId={moderator.id} />
              </div>
            )}

            {/* ── HISTORIAL ── */}
            {view === 'history' && foundPatient && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  {[
                    { id: 'consultation', label: '+ Nueva Consulta', icon: '📝' },
                    { id: 'history',      label: 'Ver Historial',    icon: '📋' },
                  ].map(t => (
                    <button key={t.id}
                      onClick={() => setView(t.id as View)}
                      style={{
                        padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontSize: '14px', fontWeight: 600,
                        background: view === t.id ? 'var(--cyan-dim)' : 'var(--bg-card)',
                        color: view === t.id ? 'var(--cyan)' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >{t.icon} {t.label}</button>
                  ))}
                </div>
                <ConsultationHistory patient={foundPatient} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── PatientRow con highlight del texto buscado ──────────────
function PatientRow({ patient, searchQuery, onClick }: {
  patient: Patient
  searchQuery: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  function highlight(text: string, query: string) {
    if (!query) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
      <span>
        {text.slice(0, idx)}
        <mark style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)', borderRadius: '2px', padding: '0 1px' }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px', borderRadius: '10px', width: '100%', textAlign: 'left',
        border: `1px solid ${hovered ? 'var(--cyan)' : 'var(--border)'}`,
        background: hovered ? 'var(--cyan-dim)' : 'var(--bg-card)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar con inicial */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: hovered ? 'var(--cyan)' : 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 700,
          color: hovered ? 'var(--bg-deep)' : 'var(--text-secondary)',
          transition: 'all 0.15s', flexShrink: 0,
        }}>
          {patient.full_name[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
            {highlight(patient.full_name, searchQuery)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            CI: {highlight(patient.cedula, searchQuery)}
            {patient.gender && <span style={{ marginLeft: '8px' }}>{patient.gender === 'M' ? '♂' : patient.gender === 'F' ? '♀' : '⚧'}</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {patient.goal_weight && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Meta: {patient.goal_weight} kg
          </span>
        )}
        <span style={{ color: 'var(--cyan)', fontSize: '16px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          →
        </span>
      </div>
    </button>
  )
}
