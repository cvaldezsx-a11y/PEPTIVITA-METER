'use client'

import { useState } from 'react'
import { supabase, type Patient } from '@/lib/supabase'

export default function NewPatientForm({
  moderatorId,
  onSuccess,
}: {
  moderatorId: string
  onSuccess: (patient: Patient) => void
}) {
  const [form, setForm] = useState({
    cedula: '', full_name: '', email: '', phone: '',
    birth_date: '', gender: 'M', goal_weight: '', goal_fat_pct: '',
    initial_weight: '', notes_general: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: any = {
        cedula: form.cedula.trim(),
        full_name: form.full_name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        birth_date: form.birth_date || null,
        gender: form.gender,
        goal_weight: form.goal_weight ? Number(form.goal_weight) : null,
        goal_fat_pct: form.goal_fat_pct ? Number(form.goal_fat_pct) : null,
        initial_weight: form.initial_weight ? Number(form.initial_weight) : null,
        notes_general: form.notes_general || null,
      }

      const { data, error: dbErr } = await supabase
        .from('patients')
        .insert(payload)
        .select()
        .single()

      if (dbErr) throw new Error(dbErr.message)

      // Crear usuario de auth para que el paciente pueda hacer login
      // Usa el service-role desde un API route de Next.js para mayor seguridad
      await fetch('/api/create-patient-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: form.cedula, patientId: data.id }),
      })

      onSuccess(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'DM Sans', fontSize: '24px', fontWeight: 700, margin: '0 0 6px' }}>
          Registrar Nuevo Paciente
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
          El paciente recibirá acceso con su cédula como usuario
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={sectionStyle}>👤 Datos Personales</h3>
          <div style={gridStyle}>
            <Field label="Número de Cédula *" required>
              <input className="input-dark" placeholder="0000000000"
                value={form.cedula} onChange={e => set('cedula', e.target.value)} required />
            </Field>
            <Field label="Nombre completo *" required>
              <input className="input-dark" placeholder="Nombre y apellidos"
                value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
            </Field>
            <Field label="Correo electrónico">
              <input className="input-dark" type="email" placeholder="paciente@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <input className="input-dark" placeholder="+593 99 000 0000"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </Field>
            <Field label="Fecha de nacimiento">
              <input className="input-dark" type="date"
                value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </Field>
            <Field label="Género">
              <select className="input-dark" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Other">Otro</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={sectionStyle}>🎯 Metas y Datos Iniciales</h3>
          <div style={gridStyle}>
            <Field label="Peso inicial (kg)">
              <input className="input-dark" type="number" step="0.1" placeholder="ej: 95.5"
                value={form.initial_weight} onChange={e => set('initial_weight', e.target.value)} />
            </Field>
            <Field label="Meta de peso (kg)">
              <input className="input-dark" type="number" step="0.1" placeholder="ej: 75.0"
                value={form.goal_weight} onChange={e => set('goal_weight', e.target.value)} />
            </Field>
            <Field label="Meta % Grasa Corporal">
              <input className="input-dark" type="number" step="0.1" placeholder="ej: 18.0"
                value={form.goal_fat_pct} onChange={e => set('goal_fat_pct', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={sectionStyle}>📋 Notas Generales</h3>
          <textarea className="input-dark" rows={4}
            placeholder="Antecedentes, condiciones relevantes, alergias..."
            value={form.notes_general} onChange={e => set('notes_general', e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '1px solid var(--red)',
            borderRadius: '8px', padding: '12px', marginBottom: '16px',
            color: 'var(--red)', fontSize: '14px',
          }}>{error}</div>
        )}

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Registrando...' : '✅ Registrar Paciente'}
        </button>
      </form>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  fontFamily: 'DM Sans', fontSize: '15px', fontWeight: 700,
  margin: '0 0 16px', color: 'var(--text-primary)',
}
const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px',
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
