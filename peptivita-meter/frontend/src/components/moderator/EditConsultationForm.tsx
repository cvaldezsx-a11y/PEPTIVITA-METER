'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Section = 'anthropo' | 'vitals' | 'peptides' | 'labs' | 'notes'

const PEPTIDE_CATALOG = [
  'Retatrutide', 'Tirzepatide', 'CJC-1295', 'Ipamorelin',
  'BPC-157', 'GHK-Cu', 'Semaglutide', 'TB-500', 'Sermorelin', 'AOD-9604', 'Personalizado'
]

const LAB_STUDIES = [
  { name: 'Perfil Lipídico',               params: ['Colesterol Total','Colesterol LDL','Colesterol HDL','Triglicéridos','VLDL'] },
  { name: 'Glicemia en ayunas',             params: ['Glicemia en ayunas'] },
  { name: 'Hemoglobina Glicosilada HbA1c',  params: ['HbA1c'] },
  { name: 'Marcadores Hepáticos',           params: ['TGO / AST','TGP / ALT','GGT','Fosfatasa Alcalina','Bilirrubina Total'] },
  { name: 'Hemograma Completo',             params: ['Hemoglobina','Hematocrito','Leucocitos','Plaquetas'] },
  { name: 'Perfil Tiroideo',                params: ['TSH','T3 libre','T4 libre'] },
  { name: 'Perfil Renal',                   params: ['Creatinina','BUN / Urea','Ácido Úrico'] },
]

export default function EditConsultationForm({
  consultation, patient, onBack
}: {
  consultation: any
  patient: any
  onBack: () => void
}) {
  const a = consultation.anthropometrics?.[0] || {}
  const existingPeps = consultation.peptide_treatments || []
  const existingLabs = consultation.lab_results || []

  const [activeSection, setActiveSection] = useState<Section>('anthropo')
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState(consultation.notes_specialist || '')

  const [anthropo, setAnthro] = useState({
    age:                  String(a.age || ''),
    height_cm:            String(a.height_cm || ''),
    weight_kg:            String(a.weight_kg || ''),
    neck_cm:              String(a.neck_cm || ''),
    wrist_cm:             String(a.wrist_cm || ''),
    bicep_left_cm:        String(a.bicep_left_cm || ''),
    bicep_right_cm:       String(a.bicep_right_cm || ''),
    bicep_left_flex_cm:   String(a.bicep_left_flex_cm || ''),
    bicep_right_flex_cm:  String(a.bicep_right_flex_cm || ''),
    chest_cm:             String(a.chest_cm || ''),
    waist_cm:             String(a.waist_cm || ''),
    hip_cm:               String(a.hip_cm || ''),
    thigh_left_cm:        String(a.thigh_left_cm || ''),
    thigh_right_cm:       String(a.thigh_right_cm || ''),
    thigh_left_flex_cm:   String(a.thigh_left_flex_cm || ''),
    thigh_right_flex_cm:  String(a.thigh_right_flex_cm || ''),
    body_fat_pct:         String(a.body_fat_pct || ''),
    muscle_mass_kg:       String(a.muscle_mass_kg || ''),
  })

  const [vitals, setVitals] = useState({
    bp_systolic:  String(a.bp_systolic || ''),
    bp_diastolic: String(a.bp_diastolic || ''),
    heart_rate:   String(a.heart_rate || ''),
  })

  // Péptidos: existentes + nuevos
  const [peptides, setPeptides] = useState<any[]>(
    existingPeps.length > 0
      ? existingPeps.map((p: any) => ({
          id: p.id,
          peptide_name: p.peptide_name || '',
          dose_value: String(p.dose_value || ''),
          dose_unit: p.dose_unit || 'mcg',
          frequency: p.frequency || 'weekly',
          administration_route: p.administration_route || 'subcutaneous',
          cycle_start: p.cycle_start || '',
          cycle_end: p.cycle_end || '',
          isNew: false,
        }))
      : []
  )

  // Labs: existentes + nuevos
  const [labs, setLabs] = useState<any[]>(
    existingLabs.map((l: any) => ({
      id: l.id,
      param: l.custom_parameter || '',
      value: String(l.value_numeric || ''),
      unit: l.custom_unit || '',
      ref_min: String(l.custom_ref_min || ''),
      ref_max: String(l.custom_ref_max || ''),
      isNew: false,
    }))
  )

  function addPeptide() {
    setPeptides(prev => [...prev, {
      id: null,
      peptide_name: 'Retatrutide',
      dose_value: '', dose_unit: 'mcg',
      frequency: 'weekly',
      administration_route: 'subcutaneous',
      cycle_start: '', cycle_end: '',
      isNew: true,
    }])
  }

  function addLabStudy(study: { name: string; params: string[] }) {
    setLabs(prev => [...prev, ...study.params.map(p => ({
      id: null, param: p, value: '', unit: 'mg/dL', ref_min: '', ref_max: '', isNew: true,
    }))])
  }

  async function handleSave() {
    setSaving(true)
    try {
      // 1. Notas
      await supabase.from('consultations').update({ notes_specialist: notes }).eq('id', consultation.id)

      // 2. Antropometría
      const anthropoData = Object.fromEntries(
        Object.entries({ ...anthropo, ...vitals }).map(([k, v]) => [k, v === '' ? null : Number(v)])
      )
      if (a.id) {
        await supabase.from('anthropometrics').update(anthropoData).eq('id', a.id)
      } else {
        await supabase.from('anthropometrics').insert({ consultation_id: consultation.id, ...anthropoData })
      }

      // 3. Péptidos — actualizar existentes, insertar nuevos
      for (const pep of peptides) {
        if (!pep.peptide_name) continue
        const payload = {
          peptide_name: pep.peptide_name,
          dose_value: pep.dose_value ? Number(pep.dose_value) : null,
          dose_unit: pep.dose_unit,
          frequency: pep.frequency,
          administration_route: pep.administration_route,
          cycle_start: pep.cycle_start || null,
          cycle_end: pep.cycle_end || null,
        }
        if (pep.id) {
          await supabase.from('peptide_treatments').update(payload).eq('id', pep.id)
        } else {
          await supabase.from('peptide_treatments').insert({
            ...payload,
            consultation_id: consultation.id,
            is_custom: pep.peptide_name === 'Personalizado',
          })
        }
      }

      // 4. Labs — actualizar existentes, insertar nuevos
      for (const lab of labs) {
        if (!lab.value && !lab.param) continue
        const payload = {
          custom_parameter: lab.param,
          custom_unit: lab.unit,
          custom_ref_min: lab.ref_min ? Number(lab.ref_min) : null,
          custom_ref_max: lab.ref_max ? Number(lab.ref_max) : null,
          value_numeric: lab.value ? Number(lab.value) : null,
        }
        if (lab.id) {
          await supabase.from('lab_results').update(payload).eq('id', lab.id)
        } else {
          await supabase.from('lab_results').insert({
            ...payload,
            consultation_id: consultation.id,
            result_date: consultation.consultation_date,
          })
        }
      }

      alert('✅ Consulta actualizada correctamente')
      onBack()
    } catch (err: any) {
      console.error(err)
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const sections: { id: Section; icon: string; label: string }[] = [
    { id: 'anthropo', icon: '📏', label: 'Antropometría' },
    { id: 'vitals',   icon: '❤️', label: 'Signos Vitales' },
    { id: 'peptides', icon: '💉', label: 'Péptidos' },
    { id: 'labs',     icon: '🧪', label: 'Laboratorio' },
    { id: 'notes',    icon: '📝', label: 'Notas' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '6px', padding: 0, display: 'block' }}>
            ← Volver al historial
          </button>
          <h2 style={{ fontFamily: 'DM Sans', fontSize: '20px', fontWeight: 700, margin: '0 0 4px' }}>
            ✏️ Editando Consulta — {patient.full_name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
            {new Date(consultation.consultation_date + 'T00:00:00').toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '💾 Guardando...' : '💾 Guardar Cambios'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500,
              background: activeSection === s.id ? 'var(--amber-dim)' : 'var(--bg-card)',
              color: activeSection === s.id ? 'var(--amber)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >{s.icon} {s.label}</button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>

        {/* ── ANTROPOMETRÍA ── */}
        {activeSection === 'anthropo' && (
          <div>
            <STitle icon="📏" title="Básicos" />
            <div style={grid}>
              {[
                { k: 'age', l: 'Edad', p: 'años' },
                { k: 'height_cm', l: 'Altura', p: 'cm' },
                { k: 'weight_kg', l: 'Peso', p: 'kg' },
                { k: 'body_fat_pct', l: '% Grasa', p: '%' },
                { k: 'muscle_mass_kg', l: 'Masa Muscular', p: 'kg' },
              ].map(f => <FF key={f.k} label={f.l} placeholder={f.p} value={(anthropo as any)[f.k]} onChange={v => setAnthro(a => ({ ...a, [f.k]: v }))} />)}
            </div>
            <STitle icon="📐" title="Perímetros (cm)" />
            <div style={grid}>
              {[
                { k: 'neck_cm', l: 'Cuello' }, { k: 'wrist_cm', l: 'Muñeca' },
                { k: 'chest_cm', l: 'Pecho' }, { k: 'waist_cm', l: 'Cintura' }, { k: 'hip_cm', l: 'Cadera' },
              ].map(f => <FF key={f.k} label={f.l} placeholder="cm" value={(anthropo as any)[f.k]} onChange={v => setAnthro(a => ({ ...a, [f.k]: v }))} />)}
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--cyan)', fontWeight: 600, marginBottom: '10px' }}>💪 Bíceps</div>
              <div style={grid}>
                {[
                  { k: 'bicep_left_cm', l: 'Bíceps Izq. relajado' },
                  { k: 'bicep_left_flex_cm', l: 'Bíceps Izq. flexionado' },
                  { k: 'bicep_right_cm', l: 'Bíceps Der. relajado' },
                  { k: 'bicep_right_flex_cm', l: 'Bíceps Der. flexionado' },
                ].map(f => <FF key={f.k} label={f.l} placeholder="cm" value={(anthropo as any)[f.k]} onChange={v => setAnthro(a => ({ ...a, [f.k]: v }))} />)}
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--cyan)', fontWeight: 600, marginBottom: '10px' }}>🦵 Muslos</div>
              <div style={grid}>
                {[
                  { k: 'thigh_left_cm', l: 'Muslo Izq. relajado' },
                  { k: 'thigh_left_flex_cm', l: 'Muslo Izq. flexionado' },
                  { k: 'thigh_right_cm', l: 'Muslo Der. relajado' },
                  { k: 'thigh_right_flex_cm', l: 'Muslo Der. flexionado' },
                ].map(f => <FF key={f.k} label={f.l} placeholder="cm" value={(anthropo as any)[f.k]} onChange={v => setAnthro(a => ({ ...a, [f.k]: v }))} />)}
              </div>
            </div>
          </div>
        )}

        {/* ── SIGNOS VITALES ── */}
        {activeSection === 'vitals' && (
          <div>
            <STitle icon="❤️" title="Signos Vitales" />
            <div style={grid}>
              <FF label="Presión Sistólica" placeholder="mmHg" value={vitals.bp_systolic} onChange={v => setVitals(vt => ({ ...vt, bp_systolic: v }))} />
              <FF label="Presión Diastólica" placeholder="mmHg" value={vitals.bp_diastolic} onChange={v => setVitals(vt => ({ ...vt, bp_diastolic: v }))} />
              <FF label="Frec. Cardíaca" placeholder="lpm" value={vitals.heart_rate} onChange={v => setVitals(vt => ({ ...vt, heart_rate: v }))} />
            </div>
          </div>
        )}

        {/* ── PÉPTIDOS ── */}
        {activeSection === 'peptides' && (
          <div>
            <STitle icon="💉" title="Péptidos" />
            {peptides.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                No hay péptidos registrados en esta consulta. Agrega uno abajo.
              </p>
            )}
            {peptides.map((pep: any, i: number) => (
              <div key={i} style={{
                background: pep.isNew ? 'rgba(0,200,255,0.04)' : 'var(--bg-elevated)',
                borderRadius: '10px', padding: '16px', marginBottom: '12px',
                border: `1px solid ${pep.isNew ? 'var(--cyan)' : 'var(--border)'}`,
              }}>
                {pep.isNew && <div style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 700, marginBottom: '10px' }}>✨ NUEVO</div>}
                <div style={grid}>
                  <div>
                    <label style={ls}>Péptido</label>
                    <select className="input-dark" value={pep.peptide_name}
                      onChange={e => { const c=[...peptides]; c[i].peptide_name=e.target.value; setPeptides(c) }}>
                      {PEPTIDE_CATALOG.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={ls}>Dosis</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input className="input-dark" type="number" value={pep.dose_value} style={{ flex: 1 }}
                        onChange={e => { const c=[...peptides]; c[i].dose_value=e.target.value; setPeptides(c) }} />
                      <select className="input-dark" style={{ width: '70px' }} value={pep.dose_unit}
                        onChange={e => { const c=[...peptides]; c[i].dose_unit=e.target.value; setPeptides(c) }}>
                        {['mcg','mg','IU','ml'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={ls}>Frecuencia</label>
                    <select className="input-dark" value={pep.frequency}
                      onChange={e => { const c=[...peptides]; c[i].frequency=e.target.value; setPeptides(c) }}>
                      {['daily','weekly','EOD','BID','monthly','custom'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={ls}>Vía</label>
                    <select className="input-dark" value={pep.administration_route}
                      onChange={e => { const c=[...peptides]; c[i].administration_route=e.target.value; setPeptides(c) }}>
                      {['subcutaneous','intramuscular','oral','topical','intranasal'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={ls}>Inicio ciclo</label>
                    <input className="input-dark" type="date" value={pep.cycle_start}
                      onChange={e => { const c=[...peptides]; c[i].cycle_start=e.target.value; setPeptides(c) }} />
                  </div>
                  <div>
                    <label style={ls}>Fin ciclo</label>
                    <input className="input-dark" type="date" value={pep.cycle_end}
                      onChange={e => { const c=[...peptides]; c[i].cycle_end=e.target.value; setPeptides(c) }} />
                  </div>
                </div>
                <button onClick={() => setPeptides(peptides.filter((_: any, pi: number) => pi !== i))}
                  style={{ marginTop: '10px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '13px' }}>
                  Eliminar
                </button>
              </div>
            ))}
            <button onClick={addPeptide} className="btn-primary" style={{ fontSize: '13px' }}>
              + Agregar Péptido
            </button>
          </div>
        )}

        {/* ── LABORATORIO ── */}
        {activeSection === 'labs' && (
          <div>
            <STitle icon="🧪" title="Resultados de Laboratorio" />

            {/* Acceso rápido por estudio */}
            <div style={{ marginBottom: '16px' }}>
              <label style={ls}>Agregar estudio completo</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {LAB_STUDIES.map(study => (
                  <button key={study.name} onClick={() => addLabStudy(study)}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--cyan)'; e.currentTarget.style.color='var(--cyan)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)' }}
                  >+ {study.name}</button>
                ))}
              </div>
            </div>

            {labs.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                No hay laboratorios registrados. Agrega un estudio arriba o un parámetro personalizado abajo.
              </p>
            )}

            {labs.length > 0 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.8fr auto', gap: '8px', padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>PARÁMETRO</span><span>VALOR</span><span>UNIDAD</span><span>REF MIN</span><span>REF MAX</span><span></span>
                </div>
                {labs.map((lab: any, i: number) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.8fr auto',
                    gap: '8px', marginBottom: '8px', alignItems: 'center',
                    background: lab.isNew ? 'rgba(0,200,255,0.03)' : 'transparent',
                    borderRadius: '6px', padding: lab.isNew ? '4px' : '0',
                    border: lab.isNew ? '1px solid rgba(0,200,255,0.2)' : 'none',
                  }}>
                    <input className="input-dark" value={lab.param} placeholder="Parámetro" style={{ fontSize: '13px' }}
                      onChange={e => { const c=[...labs]; c[i].param=e.target.value; setLabs(c) }} />
                    <input className="input-dark" type="number" value={lab.value} placeholder="Valor" style={{ fontSize: '13px' }}
                      onChange={e => { const c=[...labs]; c[i].value=e.target.value; setLabs(c) }} />
                    <input className="input-dark" value={lab.unit} placeholder="mg/dL" style={{ fontSize: '13px' }}
                      onChange={e => { const c=[...labs]; c[i].unit=e.target.value; setLabs(c) }} />
                    <input className="input-dark" type="number" value={lab.ref_min} placeholder="Min" style={{ fontSize: '13px' }}
                      onChange={e => { const c=[...labs]; c[i].ref_min=e.target.value; setLabs(c) }} />
                    <input className="input-dark" type="number" value={lab.ref_max} placeholder="Max" style={{ fontSize: '13px' }}
                      onChange={e => { const c=[...labs]; c[i].ref_max=e.target.value; setLabs(c) }} />
                    <button onClick={() => setLabs(labs.filter((_: any, li: number) => li !== i))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setLabs([...labs, { id: null, param: '', value: '', unit: '', ref_min: '', ref_max: '', isNew: true }])}
              className="btn-ghost" style={{ fontSize: '13px', marginTop: '8px' }}>
              + Agregar parámetro personalizado
            </button>
          </div>
        )}

        {/* ── NOTAS ── */}
        {activeSection === 'notes' && (
          <div>
            <STitle icon="📝" title="Notas del Especialista" />
            <textarea className="input-dark" rows={8} value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', lineHeight: '1.6' }}
              placeholder="Observaciones, ajustes de tratamiento, seguimiento..." />
          </div>
        )}
      </div>
    </div>
  )
}

const ls: React.CSSProperties = { fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }

function STitle({ icon, title }: { icon: string; title: string }) {
  return <h3 style={{ fontFamily: 'DM Sans', fontSize: '15px', fontWeight: 700, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>{icon} {title}</h3>
}

function FF({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={ls}>{label}</label>
      <input className="input-dark" type="number" step="0.1" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
