'use client'

import { useState, useEffect } from 'react'
import { supabase, type Patient } from '@/lib/supabase'
import EditConsultationForm from './EditConsultationForm'

export default function ConsultationHistory({ patient }: { patient: Patient }) {
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { loadConsultations() }, [])

  async function loadConsultations() {
    setLoading(true)
    try {
      // 1. Buscamos solo las consultas principales
      const { data: consults, error: consultErr } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patient.id)
        .order('consultation_date', { ascending: false })

      if (consultErr) throw consultErr

      if (!consults || consults.length === 0) {
        setConsultations([])
        setLoading(false)
        return
      }

      // Extraemos los IDs de las consultas para buscar sus detalles
      const ids = consults.map(c => c.id)

      // 2. Buscamos los detalles por separado (Sin joins anidados)
      const [
        { data: anthro },
        { data: peps },
        { data: labs },
        { data: photos }
      ] = await Promise.all([
        supabase.from('anthropometrics').select('*').in('consultation_id', ids),
        supabase.from('peptide_treatments').select('*').in('consultation_id', ids),
        supabase.from('lab_results').select('*').in('consultation_id', ids),
        supabase.from('progress_photos').select('*').in('consultation_id', ids)
      ])

      // 3. Unimos manualmente los datos en Javascript
      const merged = consults.map(c => ({
        ...c,
        anthropometrics: (anthro || []).filter((a: any) => a.consultation_id === c.id),
        peptide_treatments: (peps || []).filter((p: any) => p.consultation_id === c.id),
        lab_results: (labs || []).filter((l: any) => l.consultation_id === c.id),
        progress_photos: (photos || []).filter((ph: any) => ph.consultation_id === c.id)
      }))

      setConsultations(merged)
    } catch (err) {
      console.error("🚨 Error cargando historial:", err)
    } finally {
      setLoading(false)
    }
  }

  if (editingId) {
    const consult = consultations.find(c => c.id === editingId)
    return (
      <EditConsultationForm
        consultation={consult}
        patient={patient}
        onBack={() => { setEditingId(null); loadConsultations() }}
      />
    )
  }

  if (loading) return (
    <div style={{ padding: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
      Cargando historial...
    </div>
  )

  if (consultations.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
      <p style={{ color: 'var(--text-secondary)' }}>No hay consultas registradas aún.</p>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'DM Sans', fontSize: '20px', fontWeight: 700, margin: 0 }}>
          📋 Historial de Consultas
        </h2>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {consultations.length} consulta{consultations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {consultations.map((c, i) => {
          const a = c.anthropometrics?.[0]
          const peps = c.peptide_treatments || []
          const labs = c.lab_results || []
          const photos = c.progress_photos || []

          return (
            <div key={c.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Header de la consulta */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'var(--cyan-dim)', color: 'var(--cyan)',
                    borderRadius: '8px', padding: '4px 10px',
                    fontSize: '12px', fontWeight: 700,
                  }}>
                    #{consultations.length - i}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>
                      {new Date(c.consultation_date + 'T00:00:00').toLocaleDateString('es', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {[
                        a && '📏 Mediciones',
                        peps.length > 0 && `💉 ${peps.length} péptido${peps.length > 1 ? 's' : ''}`,
                        labs.length > 0 && `🧪 ${labs.length} lab${labs.length > 1 ? 's' : ''}`,
                        photos.length > 0 && `📸 ${photos.length} foto${photos.length > 1 ? 's' : ''}`,
                        c.notes_specialist && '📝 Notas',
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setEditingId(c.id)}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  ✏️ Editar
                </button>
              </div>

              {/* Resumen rápido */}
              <div style={{ padding: '16px 20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {a?.weight_kg && (
                  <Stat label="Peso" value={`${a.weight_kg} kg`} color="var(--cyan)" />
                )}
                {a?.body_fat_pct && (
                  <Stat label="% Grasa" value={`${a.body_fat_pct}%`} color="var(--amber)" />
                )}
                {a?.muscle_mass_kg && (
                  <Stat label="Músculo" value={`${a.muscle_mass_kg} kg`} color="var(--purple)" />
                )}
                {a?.waist_cm && (
                  <Stat label="Cintura" value={`${a.waist_cm} cm`} color="var(--green)" />
                )}
                {a?.bmi && (
                  <Stat label="IMC" value={Number(a.bmi).toFixed(1)} color="var(--text-secondary)" />
                )}
                {a?.bp_systolic && a?.bp_diastolic && (
                  <Stat label="Presión" value={`${a.bp_systolic}/${a.bp_diastolic}`} color="var(--red)" />
                )}
              </div>

              {/* Notas del especialista */}
              {c.notes_specialist && (
                <div style={{
                  margin: '0 20px 16px',
                  background: 'var(--cyan-dim)',
                  borderLeft: '3px solid var(--cyan)',
                  borderRadius: '0 8px 8px 0',
                  padding: '10px 14px',
                  fontSize: '13px', lineHeight: '1.6',
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Nota: </span>
                  {c.notes_specialist}
                </div>
              )}

              {/* Péptidos */}
              {peps.length > 0 && (
                <div style={{ padding: '0 20px 16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
                    PÉPTIDOS
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {peps.map((pep: any) => (
                      <span key={pep.id} style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: '20px', padding: '4px 12px',
                        fontSize: '12px', color: 'var(--text-secondary)',
                      }}>
                        💉 {pep.peptide_name} {pep.dose_value}{pep.dose_unit} · {pep.frequency}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Labs con clasificación */}
              {labs.length > 0 && (
                <div style={{ padding: '0 20px 16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>
                    LABORATORIO
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {labs.map((lab: any) => {
                      const cls = lab.classification
                      const colors: Record<string, string> = { NORMAL: 'var(--green)', LOW: 'var(--cyan)', HIGH: 'var(--red)', UNCLASSIFIED: 'var(--text-muted)' }
                      const bgs: Record<string, string> = { NORMAL: 'var(--green-dim)', LOW: 'var(--cyan-dim)', HIGH: 'var(--red-dim)', UNCLASSIFIED: 'var(--bg-elevated)' }
                      return (
                        <span key={lab.id} style={{
                          background: bgs[cls] || 'var(--bg-elevated)',
                          border: `1px solid ${colors[cls] || 'var(--border)'}`,
                          borderRadius: '20px', padding: '4px 12px',
                          fontSize: '12px', color: colors[cls] || 'var(--text-secondary)',
                        }}>
                          {lab.custom_parameter}: {lab.value_numeric} {lab.custom_unit}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  )
}