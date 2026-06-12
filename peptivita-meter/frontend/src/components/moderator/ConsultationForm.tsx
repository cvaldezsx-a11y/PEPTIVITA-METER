'use client'

import { useState } from 'react'
import { supabase, type Patient } from '@/lib/supabase'

const PEPTIDE_CATALOG = [
  'Retatrutide', 'Tirzepatide', 'CJC-1295', 'Ipamorelin',
  'BPC-157', 'GHK-Cu', 'Semaglutide', 'TB-500', 'Sermorelin', 'AOD-9604', 'Personalizado'
]

const LAB_STUDIES = [
  { id: 1,  name: 'Perfil Lipídico',               params: ['Colesterol Total','Colesterol LDL','Colesterol HDL','Triglicéridos','VLDL'] },
  { id: 2,  name: 'Glicemia en ayunas',             params: ['Glicemia en ayunas'] },
  { id: 3,  name: 'Hemoglobina Glicosilada HbA1c',  params: ['HbA1c'] },
  { id: 4,  name: 'Marcadores Hepáticos',           params: ['TGO / AST','TGP / ALT','GGT','Fosfatasa Alcalina','Bilirrubina Total'] },
  { id: 5,  name: 'Hemograma Completo',             params: ['Hemoglobina','Hematocrito','Leucocitos','Plaquetas'] },
  { id: 6,  name: 'Perfil Tiroideo',                params: ['TSH','T3 libre','T4 libre'] },
  { id: 8,  name: 'Perfil Renal',                   params: ['Creatinina','BUN / Urea','Ácido Úrico'] },
]

type Section = 'anthropo' | 'vitals' | 'peptides' | 'labs' | 'photos' | 'notes'

// ── IMC y Peso Ideal ──────────────────────────────────────
function calcIMC(weight: number, height: number) {
  if (!weight || !height) return null
  return weight / Math.pow(height / 100, 2)
}

function imcCategory(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: 'Bajo peso', color: 'var(--cyan)' }
  if (imc < 25)   return { label: 'Normal ✓', color: 'var(--green)' }
  if (imc < 30)   return { label: 'Sobrepeso', color: 'var(--amber)' }
  if (imc < 35)   return { label: 'Obesidad I', color: '#FF8C42' }
  if (imc < 40)   return { label: 'Obesidad II', color: 'var(--red)' }
  return { label: 'Obesidad III', color: 'var(--red)' }
}

function calcPesoIdeal(height: number, gender: string): { min: number; max: number } {
  // Fórmula Devine modificada con rango IMC 20-25
  const h = height / 100
  return { min: Math.round(20 * h * h * 10) / 10, max: Math.round(25 * h * h * 10) / 10 }
}

function IMCWidget({ weight, height, gender }: { weight: string; height: string; gender: string }) {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  if (!w || !h || h < 100) return null

  const imc = calcIMC(w, h)!
  const cat = imcCategory(imc)
  const ideal = calcPesoIdeal(h, gender)
  const diff = w - ideal.max
  const imcPct = Math.min(100, Math.max(0, ((imc - 10) / 30) * 100))

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,200,255,0.06), rgba(0,229,160,0.06))',
      border: '1px solid var(--border)',
      borderRadius: '12px', padding: '20px', marginBottom: '24px',
    }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.5px' }}>
        📊 CÁLCULO AUTOMÁTICO
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {/* IMC */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ÍNDICE DE MASA CORPORAL</div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: cat.color }}>
            {imc.toFixed(1)}
          </div>
          <div style={{ fontSize: '13px', color: cat.color, fontWeight: 600 }}>{cat.label}</div>
          {/* Barra IMC */}
          <div style={{ marginTop: '8px', height: '6px', borderRadius: '999px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '999px', width: `${imcPct}%`,
              background: `linear-gradient(90deg, var(--cyan), ${cat.color})`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>18.5</span><span>25</span><span>30</span><span>40</span>
          </div>
        </div>

        {/* Peso ideal */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>PESO IDEAL (IMC 20–25)</div>
          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)' }}>
            {ideal.min} – {ideal.max} kg
          </div>
          <div style={{ fontSize: '13px', marginTop: '4px', color: diff > 0 ? 'var(--amber)' : 'var(--green)', fontWeight: 600 }}>
            {diff > 0
              ? `▲ ${diff.toFixed(1)} kg sobre el rango`
              : diff < -2
              ? `▼ ${Math.abs(diff).toFixed(1)} kg bajo el rango`
              : '✓ Dentro del rango ideal'}
          </div>
        </div>

        {/* Para llegar al peso ideal */}
        {diff > 0 && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>META SUGERIDA</div>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)' }}>
              -{diff.toFixed(1)} kg
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Para alcanzar {ideal.max} kg
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConsultationForm({
  patient, moderatorId
}: {
  patient: Patient
  moderatorId: string
}) {
  const [activeSection, setActiveSection] = useState<Section>('anthropo')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [consultDate, setConsultDate] = useState(new Date().toISOString().split('T')[0])

  const [anthropo, setAnthro] = useState({
    age: '', height_cm: '', weight_kg: '',
    neck_cm: '', wrist_cm: '',
    bicep_left_cm: '', bicep_right_cm: '',
    bicep_left_flex_cm: '', bicep_right_flex_cm: '',
    chest_cm: '', waist_cm: '', hip_cm: '',
    thigh_left_cm: '', thigh_right_cm: '',
    thigh_left_flex_cm: '', thigh_right_flex_cm: '',
    body_fat_pct: '', muscle_mass_kg: '',
  })
  const [vitals, setVitals] = useState({ bp_systolic: '', bp_diastolic: '', heart_rate: '' })
  const [peptides, setPeptides] = useState([{
    peptide_name: 'Retatrutide', is_custom: false,
    dose_value: '', dose_unit: 'mcg', frequency: 'weekly',
    administration_route: 'subcutaneous', cycle_start: '', cycle_end: '',
  }])
  const [labEntries, setLabEntries] = useState<{ study: string; param: string; value: string; unit: string; ref_min: string; ref_max: string }[]>([])
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<{ file: File; angle: 'front' | 'side' | 'back' }[]>([])

  async function handleSave() {
    setSaving(true)
    try {
      const { data: consult, error: cErr } = await supabase
        .from('consultations')
        .insert({
          patient_id: patient.id,
          moderator_id: moderatorId,
          consultation_date: consultDate,
          notes_specialist: notes,
        })
        .select().single()
      if (cErr) throw cErr

      const anthropoData = Object.fromEntries(
        Object.entries({ ...anthropo, ...vitals }).map(([k, v]) => [k, v === '' ? null : Number(v)])
      )
      await supabase.from('anthropometrics').insert({ consultation_id: consult.id, ...anthropoData })

      for (const pep of peptides) {
        if (!pep.peptide_name) continue
        await supabase.from('peptide_treatments').insert({
          consultation_id: consult.id,
          peptide_name: pep.peptide_name,
          is_custom: pep.peptide_name === 'Personalizado',
          dose_value: pep.dose_value ? Number(pep.dose_value) : null,
          dose_unit: pep.dose_unit, frequency: pep.frequency,
          administration_route: pep.administration_route,
          cycle_start: pep.cycle_start || null, cycle_end: pep.cycle_end || null,
        })
      }

      for (const lab of labEntries) {
        if (!lab.value) continue
        await supabase.from('lab_results').insert({
          consultation_id: consult.id,
          custom_parameter: lab.param, custom_unit: lab.unit,
          custom_ref_min: lab.ref_min ? Number(lab.ref_min) : null,
          custom_ref_max: lab.ref_max ? Number(lab.ref_max) : null,
          value_numeric: Number(lab.value), result_date: consultDate,
        })
      }

      for (const photo of photos) {
        const path = `${patient.id}/${consultDate}/${photo.angle}_${Date.now()}.jpg`
        await supabase.storage.from('progress-photos').upload(path, photo.file)
        await supabase.from('progress_photos').insert({
          consultation_id: consult.id, patient_id: patient.id,
          angle: photo.angle, storage_path: path, photo_date: consultDate,
        })
      }

      setSaved(true)
    } catch (err) {
      console.error(err)
      alert('Error al guardar. Revisa la consola.')
    } finally {
      setSaving(false)
    }
  }

  const sections: { id: Section; icon: string; label: string }[] = [
    { id: 'anthropo', icon: '📏', label: 'Antropometría' },
    { id: 'vitals',   icon: '❤️', label: 'Signos Vitales' },
    { id: 'peptides', icon: '💉', label: 'Péptidos' },
    { id: 'labs',     icon: '🧪', label: 'Laboratorio' },
    { id: 'photos',   icon: '📸', label: 'Fotos' },
    { id: 'notes',    icon: '📝', label: 'Notas' },
  ]

  if (saved) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
      <h2 style={{ fontFamily: 'DM Sans', fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        Consulta guardada correctamente
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Todos los datos de {patient.full_name} han sido registrados.
      </p>
      <button className="btn-primary" onClick={() => setSaved(false)}>+ Nueva Consulta</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'DM Sans', fontSize: '20px', fontWeight: 700, margin: '0 0 4px' }}>
            Nueva Consulta — {patient.full_name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Cédula: {patient.cedula}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input className="input-dark" type="date" value={consultDate}
            onChange={e => setConsultDate(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '💾 Guardando...' : '💾 Guardar Todo'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500,
              background: activeSection === s.id ? 'var(--cyan-dim)' : 'var(--bg-card)',
              color: activeSection === s.id ? 'var(--cyan)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >{s.icon} {s.label}</button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>

        {/* ── ANTROPOMETRÍA ── */}
        {activeSection === 'anthropo' && (
          <div>
            <SectionTitle icon="📏" title="Antropometría Básica" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              {[
                { key: 'age',           label: 'Edad',             placeholder: 'años' },
                { key: 'height_cm',     label: 'Altura',           placeholder: 'cm' },
                { key: 'weight_kg',     label: 'Peso actual',      placeholder: 'kg' },
                { key: 'body_fat_pct',  label: '% Grasa Corporal', placeholder: '%' },
                { key: 'muscle_mass_kg',label: 'Masa Muscular',    placeholder: 'kg' },
              ].map(f => (
                <FormField key={f.key} label={f.label} placeholder={f.placeholder}
                  value={(anthropo as any)[f.key]}
                  onChange={v => setAnthro(a => ({ ...a, [f.key]: v }))}
                />
              ))}
            </div>

            {/* Widget IMC en tiempo real */}
            <IMCWidget
              weight={anthropo.weight_kg}
              height={anthropo.height_cm}
              gender={patient.gender || 'M'}
            />

            <SectionTitle icon="📐" title="Perímetros Corporales (cm)" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              <FormField label="Cuello" placeholder="cm" value={anthropo.neck_cm} onChange={v => setAnthro(a => ({ ...a, neck_cm: v }))} />
              <FormField label="Muñeca" placeholder="cm" value={anthropo.wrist_cm} onChange={v => setAnthro(a => ({ ...a, wrist_cm: v }))} />
              <FormField label="Pecho" placeholder="cm" value={anthropo.chest_cm} onChange={v => setAnthro(a => ({ ...a, chest_cm: v }))} />
              <FormField label="Cintura" placeholder="cm" value={anthropo.waist_cm} onChange={v => setAnthro(a => ({ ...a, waist_cm: v }))} />
              <FormField label="Cadera" placeholder="cm" value={anthropo.hip_cm} onChange={v => setAnthro(a => ({ ...a, hip_cm: v }))} />
            </div>

            {/* Bíceps */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--cyan)', fontWeight: 600, marginBottom: '12px' }}>💪 Bíceps</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                <FormField label="Bíceps Izquierdo relajado" placeholder="cm" value={anthropo.bicep_left_cm} onChange={v => setAnthro(a => ({ ...a, bicep_left_cm: v }))} />
                <FormField label="Bíceps Izquierdo flexionado" placeholder="cm" value={anthropo.bicep_left_flex_cm} onChange={v => setAnthro(a => ({ ...a, bicep_left_flex_cm: v }))} />
                <FormField label="Bíceps Derecho relajado" placeholder="cm" value={anthropo.bicep_right_cm} onChange={v => setAnthro(a => ({ ...a, bicep_right_cm: v }))} />
                <FormField label="Bíceps Derecho flexionado" placeholder="cm" value={anthropo.bicep_right_flex_cm} onChange={v => setAnthro(a => ({ ...a, bicep_right_flex_cm: v }))} />
              </div>
            </div>

            {/* Muslos */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--cyan)', fontWeight: 600, marginBottom: '12px' }}>🦵 Muslos</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                <FormField label="Muslo Izquierdo relajado" placeholder="cm" value={anthropo.thigh_left_cm} onChange={v => setAnthro(a => ({ ...a, thigh_left_cm: v }))} />
                <FormField label="Muslo Izquierdo flexionado" placeholder="cm" value={anthropo.thigh_left_flex_cm} onChange={v => setAnthro(a => ({ ...a, thigh_left_flex_cm: v }))} />
                <FormField label="Muslo Derecho relajado" placeholder="cm" value={anthropo.thigh_right_cm} onChange={v => setAnthro(a => ({ ...a, thigh_right_cm: v }))} />
                <FormField label="Muslo Derecho flexionado" placeholder="cm" value={anthropo.thigh_right_flex_cm} onChange={v => setAnthro(a => ({ ...a, thigh_right_flex_cm: v }))} />
              </div>
            </div>
          </div>
        )}

        {/* ── SIGNOS VITALES ── */}
        {activeSection === 'vitals' && (
          <div>
            <SectionTitle icon="❤️" title="Signos Vitales" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              <FormField label="Presión Sistólica" placeholder="mmHg" value={vitals.bp_systolic} onChange={v => setVitals(vt => ({ ...vt, bp_systolic: v }))} />
              <FormField label="Presión Diastólica" placeholder="mmHg" value={vitals.bp_diastolic} onChange={v => setVitals(vt => ({ ...vt, bp_diastolic: v }))} />
              <FormField label="Frec. Cardíaca en reposo" placeholder="lpm" value={vitals.heart_rate} onChange={v => setVitals(vt => ({ ...vt, heart_rate: v }))} />
            </div>
          </div>
        )}

        {/* ── PÉPTIDOS ── */}
        {activeSection === 'peptides' && (
          <div>
            <SectionTitle icon="💉" title="Registro de Péptidos y Tratamiento" />
            {peptides.map((pep, i) => (
              <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '20px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Péptido</label>
                    <select className="input-dark" value={pep.peptide_name}
                      onChange={e => { const c=[...peptides]; c[i].peptide_name=e.target.value; setPeptides(c) }}>
                      {PEPTIDE_CATALOG.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Dosis</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input className="input-dark" placeholder="Valor" value={pep.dose_value}
                        onChange={e => { const c=[...peptides]; c[i].dose_value=e.target.value; setPeptides(c) }} style={{ flex: 1 }} />
                      <select className="input-dark" style={{ width: '70px' }} value={pep.dose_unit}
                        onChange={e => { const c=[...peptides]; c[i].dose_unit=e.target.value; setPeptides(c) }}>
                        {['mcg','mg','IU','ml'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Frecuencia</label>
                    <select className="input-dark" value={pep.frequency}
                      onChange={e => { const c=[...peptides]; c[i].frequency=e.target.value; setPeptides(c) }}>
                      {['daily','weekly','EOD','BID','monthly','custom'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Vía de administración</label>
                    <select className="input-dark" value={pep.administration_route}
                      onChange={e => { const c=[...peptides]; c[i].administration_route=e.target.value; setPeptides(c) }}>
                      {['subcutaneous','intramuscular','oral','topical','intranasal'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Inicio ciclo</label>
                    <input className="input-dark" type="date" value={pep.cycle_start}
                      onChange={e => { const c=[...peptides]; c[i].cycle_start=e.target.value; setPeptides(c) }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fin ciclo</label>
                    <input className="input-dark" type="date" value={pep.cycle_end}
                      onChange={e => { const c=[...peptides]; c[i].cycle_end=e.target.value; setPeptides(c) }} />
                  </div>
                </div>
                {peptides.length > 1 && (
                  <button onClick={() => setPeptides(peptides.filter((_, pi) => pi !== i))}
                    style={{ marginTop: '12px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '13px' }}>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setPeptides([...peptides, { peptide_name: 'Retatrutide', is_custom: false, dose_value: '', dose_unit: 'mcg', frequency: 'weekly', administration_route: 'subcutaneous', cycle_start: '', cycle_end: '' }])}
              className="btn-ghost" style={{ fontSize: '13px' }}>
              + Agregar Péptido
            </button>
          </div>
        )}

        {/* ── LABORATORIO ── */}
        {activeSection === 'labs' && (
          <div>
            <SectionTitle icon="🧪" title="Exámenes de Laboratorio" />
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Agregar estudio completo</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {LAB_STUDIES.map(study => (
                  <button key={study.id}
                    onClick={() => setLabEntries(prev => [...prev, ...study.params.map(p => ({ study: study.name, param: p, value: '', unit: 'mg/dL', ref_min: '', ref_max: '' }))])}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--cyan)'; e.currentTarget.style.color='var(--cyan)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)' }}
                  >+ {study.name}</button>
                ))}
              </div>
            </div>
            {labEntries.length > 0 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr auto', gap: '8px', padding: '8px 12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span>ESTUDIO</span><span>PARÁMETRO</span><span>VALOR</span><span>UNIDAD</span><span>REF MIN</span><span>REF MAX</span><span></span>
                </div>
                {labEntries.map((entry, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr 0.8fr 0.8fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 0' }}>{entry.study}</span>
                    <input className="input-dark" value={entry.param} style={{ fontSize: '13px' }} onChange={e => { const c=[...labEntries]; c[i].param=e.target.value; setLabEntries(c) }} />
                    <input className="input-dark" type="number" placeholder="0.0" value={entry.value} style={{ fontSize: '13px' }} onChange={e => { const c=[...labEntries]; c[i].value=e.target.value; setLabEntries(c) }} />
                    <input className="input-dark" value={entry.unit} style={{ fontSize: '13px' }} onChange={e => { const c=[...labEntries]; c[i].unit=e.target.value; setLabEntries(c) }} />
                    <input className="input-dark" type="number" value={entry.ref_min} style={{ fontSize: '13px' }} onChange={e => { const c=[...labEntries]; c[i].ref_min=e.target.value; setLabEntries(c) }} />
                    <input className="input-dark" type="number" value={entry.ref_max} style={{ fontSize: '13px' }} onChange={e => { const c=[...labEntries]; c[i].ref_max=e.target.value; setLabEntries(c) }} />
                    <button onClick={() => setLabEntries(labEntries.filter((_, li) => li !== i))}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setLabEntries([...labEntries, { study: 'Personalizado', param: '', value: '', unit: '', ref_min: '', ref_max: '' }])}
              className="btn-ghost" style={{ fontSize: '13px', marginTop: '8px' }}>
              + Agregar parámetro personalizado
            </button>
          </div>
        )}

        {/* ── FOTOS ── */}
        {activeSection === 'photos' && (
          <div>
            <SectionTitle icon="📸" title="Fotos de Progreso" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              {(['front','side','back'] as const).map(angle => {
                const existing = photos.find(p => p.angle === angle)
                const labels = { front: 'Frente', side: 'Perfil', back: 'Espalda' }
                return (
                  <label key={angle} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: `2px dashed ${existing ? 'var(--green)' : 'var(--border)'}`,
                    borderRadius: '12px', padding: '24px 16px', cursor: 'pointer',
                    background: existing ? 'var(--green-dim)' : 'transparent', minHeight: '140px',
                  }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => { const file = e.target.files?.[0]; if (file) setPhotos(prev => [...prev.filter(p => p.angle !== angle), { file, angle }]) }} />
                    <span style={{ fontSize: '28px', marginBottom: '8px' }}>{existing ? '✅' : '📷'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: existing ? 'var(--green)' : 'var(--text-secondary)' }}>{labels[angle]}</span>
                    {existing && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{existing.file.name}</span>}
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* ── NOTAS ── */}
        {activeSection === 'notes' && (
          <div>
            <SectionTitle icon="📝" title="Notas del Especialista" />
            <textarea className="input-dark" rows={8}
              placeholder="Observaciones clínicas, respuesta al tratamiento, recomendaciones, próximos ajustes..."
              value={notes} onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', lineHeight: '1.6' }} />
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px', color: 'var(--text-secondary)',
  display: 'block', marginBottom: '6px', fontWeight: 500,
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 style={{ fontFamily: 'DM Sans', fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{icon}</span> {title}
    </h3>
  )
}

function FormField({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input className="input-dark" type="number" step="0.1" placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
