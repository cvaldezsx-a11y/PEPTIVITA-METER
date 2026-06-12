'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import PatientDashboard from '@/components/patient/PatientDashboard'

export default function PatientLogin({ onBack }: { onBack: () => void }) {
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patient, setPatient] = useState<any>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Login por cédula: el email es cedula@peptivita.local
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: `${cedula}@peptivita.local`,
        password,
      })
      if (authError) throw new Error('Cédula o contraseña incorrectos')

      // Buscar datos del paciente
      const { data: patientData, error: patError } = await supabase
        .from('patients')
        .select('*')
        .eq('cedula', cedula)
        .single()

      if (patError || !patientData) throw new Error('Paciente no encontrado')
      setPatient(patientData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (patient) return <PatientDashboard patient={patient} onLogout={() => { setPatient(null); supabase.auth.signOut() }} />

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        {/* Header */}
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '24px', padding: 0 }}
        >
          ← Volver
        </button>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>👤</div>
          <h1 style={{ fontFamily: 'DM Sans', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>
            Acceso Paciente
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Ingresa con tu número de cédula
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Número de Cédula
            </label>
            <input
              className="input-dark"
              type="text"
              placeholder="0000000000"
              value={cedula}
              onChange={e => setCedula(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              className="input-dark"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: '8px', padding: '12px', marginBottom: '16px',
              color: 'var(--red)', fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Verificando...' : 'Ingresar al Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
