'use client'

import { useState, useEffect } from 'react'
import { supabase, type Patient, classifyWHR, classifyFrameSize } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

// ── IMC Widget ───────────────────────────────────────────────
function IMCPatientWidget({ weight, height, goalWeight, initialWeight, isMobile }: {
  weight: number; height: number; goalWeight?: number; initialWeight?: number; isMobile: boolean
}) {
  const imc = weight / Math.pow(height / 100, 2)
  const idealMin = Math.round(20 * Math.pow(height / 100, 2) * 10) / 10
  const idealMax = Math.round(25 * Math.pow(height / 100, 2) * 10) / 10
  const diff = weight - idealMax
  const kgToIdeal = diff > 0 ? diff : 0

  const getCategory = (v: number) => {
    if (v < 18.5) return { label: 'Bajo peso',   color: 'var(--cyan)',  emoji: '💙', msg: 'Trabajando para alcanzar el peso óptimo.' }
    if (v < 25)   return { label: 'Normal ✓',    color: 'var(--green)', emoji: '💚', msg: '¡En rango ideal! Mantén el ritmo.' }
    if (v < 30)   return { label: 'Sobrepeso',   color: 'var(--amber)', emoji: '🌟', msg: 'Vas por buen camino. Cada kg menos es una victoria.' }
    if (v < 35)   return { label: 'Obesidad I',  color: '#FF8C42',      emoji: '🔥', msg: '¡Tu dedicación está dando resultados!' }
    if (v < 40)   return { label: 'Obesidad II', color: 'var(--red)',   emoji: '💪', msg: 'El camino es largo pero ya empezaste.' }
    return               { label: 'Obesidad III',color: 'var(--red)',   emoji: '🚀', msg: 'Has dado el paso más importante: comenzar.' }
  }

  const cat = getCategory(imc)
  const imcBarPct = Math.min(100, Math.max(0, ((imc - 15) / 30) * 100))

  let progressPct = 100
  if (initialWeight && initialWeight > idealMax && diff > 0) {
    const totalToLose = initialWeight - idealMax
    const lost = initialWeight - weight
    progressPct = Math.min(100, Math.max(0, (lost / totalToLose) * 100))
  } else if (diff <= 0) {
    progressPct = 100
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${cat.color}40`,
      borderRadius: '16px', padding: isMobile ? '20px' : '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: `${cat.color}10`, filter: 'blur(40px)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '24px', position: 'relative' }}>
        {/* IMC */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>ÍNDICE DE MASA CORPORAL</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '42px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: cat.color, lineHeight: 1 }}>{imc.toFixed(1)}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kg/m²</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${cat.color}20`, color: cat.color, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            {cat.emoji} {cat.label}
          </div>
          <div style={{ position: 'relative', marginBottom: '6px' }}>
            <div style={{ height: '10px', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '23%', background: 'var(--cyan)', opacity: 0.7 }} />
              <div style={{ width: '22%', background: 'var(--green)', opacity: 0.7 }} />
              <div style={{ width: '17%', background: 'var(--amber)', opacity: 0.7 }} />
              <div style={{ width: '17%', background: '#FF8C42', opacity: 0.7 }} />
              <div style={{ width: '21%', background: 'var(--red)', opacity: 0.7 }} />
            </div>
            <div style={{ position: 'absolute', top: '-3px', left: `calc(${imcBarPct}% - 8px)`, width: '16px', height: '16px', borderRadius: '50%', background: cat.color, border: '2px solid var(--bg-deep)', boxShadow: `0 0 8px ${cat.color}` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>45</span>
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Rango ideal: <span style={{ color: 'var(--green)', fontWeight: 600 }}>{idealMin} – {idealMax} kg</span>
          </div>
        </div>
        {/* Progreso */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>PROGRESO HACIA PESO IDEAL</div>
          {progressPct >= 100 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)' }}>¡Meta alcanzada!</div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>{progressPct.toFixed(0)}%</span>
                {kgToIdeal > 0 && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Faltan <b style={{ color: 'var(--amber)' }}>{kgToIdeal.toFixed(1)} kg</b></span>}
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '999px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', borderRadius: '999px', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--cyan), var(--green))', boxShadow: '0 0 10px rgba(0,229,160,0.4)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <span>Inicio</span><span>25%</span><span>50%</span><span>75%</span><span>Meta ✓</span>
              </div>
            </div>
          )}
          <div style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}30`, borderRadius: '10px', padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>
            {cat.emoji} {cat.msg}
          </div>
        </div>
      </div>
    </div>
  )
}

type Tab = 'dashboard' | 'labs' | 'photos' | 'history'

export default function PatientDashboard({ patient, onLogout }: { patient: Patient; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [consultations, setConsultations] = useState<any[]>([])
  const [anthropoHistory, setAnthroHistory] = useState<any[]>([])
  const [latestAnthro, setLatestAnthro] = useState<any>(null)
  const [latestNotes, setLatestNotes] = useState('')
  const [activePeptides, setActivePeptides] = useState<any[]>([])
  const [labResults, setLabResults] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Detector de pantallas móviles
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data: consults, error: consultErr } = await supabase
      .from('consultations').select('*')
      .eq('patient_id', patient.id)
      .order('consultation_date', { ascending: true })

    if (consultErr) console.error('Error consultations:', consultErr)
    setConsultations(consults || [])

    if (consults && consults.length > 0) {
      const ids = consults.map((c: any) => c.id)
      const dateById: Record<string, string> = {}
      consults.forEach((c: any) => { dateById[c.id] = c.consultation_date })

      const latest = consults[consults.length - 1]
      setLatestNotes(latest.notes_specialist || '')

      const { data: anthrosRaw, error: anthroErr } = await supabase
        .from('anthropometrics').select('*')
        .in('consultation_id', ids)
      if (anthroErr) console.error('Error anthropometrics:', anthroErr)

      const anthros = (anthrosRaw || []).map((a: any) => ({
        ...a, consultations: { consultation_date: dateById[a.consultation_id] }
      }))
      const sorted = anthros.sort((a: any, b: any) =>
        new Date(a.consultations.consultation_date).getTime() - new Date(b.consultations.consultation_date).getTime()
      )
      setAnthroHistory(sorted)
      if (sorted.length > 0) setLatestAnthro(sorted[sorted.length - 1])

      const { data: peps, error: pepErr } = await supabase
        .from('peptide_treatments').select('*')
        .in('consultation_id', ids).eq('is_active', true)
      if (pepErr) console.error('Error peptides:', pepErr)
      setActivePeptides(peps || [])

      const { data: labsRaw, error: labErr } = await supabase
        .from('lab_results').select('*')
        .in('consultation_id', ids)
      if (labErr) console.error('Error labs:', labErr)

      const labs = (labsRaw || []).map((l: any) => ({
        ...l, consultations: { consultation_date: dateById[l.consultation_id] }
      }))
      setLabResults(labs)

      const { data: ph, error: phErr } = await supabase
        .from('progress_photos').select('*')
        .eq('patient_id', patient.id).order('photo_date', { ascending: false })
      if (phErr) console.error('Error photos:', phErr)
      setPhotos(ph || [])
    }
    setLoading(false)
  }

  const initialWeight = patient.initial_weight || anthropoHistory[0]?.weight_kg
  const currentWeight = latestAnthro?.weight_kg
  const pctLost = initialWeight && currentWeight
    ? ((initialWeight - currentWeight) / initialWeight * 100).toFixed(1) : null
  const goalWeight = patient.goal_weight
  const progressToGoal = initialWeight && goalWeight && currentWeight
    ? Math.min(100, Math.max(0, ((initialWeight - currentWeight) / (initialWeight - goalWeight) * 100))) : null
  const whr = latestAnthro?.waist_hip_ratio
  const whrClass = whr && patient.gender ? classifyWHR(whr, patient.gender as any) : null
  const frameSize = latestAnthro?.height_cm && latestAnthro?.wrist_cm
    ? classifyFrameSize(latestAnthro.height_cm, latestAnthro.wrist_cm, patient.gender as any) : null

  const chartData = anthropoHistory.map((a: any) => ({
    date: a.consultations?.consultation_date?.slice(0, 10) || '',
    peso: a.weight_kg, grasa: a.body_fat_pct, musculo: a.muscle_mass_kg,
  }))

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '🏠', label: 'Resumen' },
    { id: 'labs',      icon: '🧪', label: 'Laboratorio' },
    { id: 'photos',    icon: '📸', label: 'Progreso' },
    { id: 'history',   icon: '📋', label: 'Historial' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧬</div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando tu dashboard...</p>
      </div>
    </div>
  )

  const firstName = patient.full_name?.split(' ')[0] || 'Paciente'

  return (
    // Se usa 100dvh para Safari en lugar de 100vh
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100dvh', background: 'var(--bg-deep)' }}>
      
      {/* ── HEADER MÓVIL ── */}
      {isMobile && (
        <header style={{ padding: '16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🧬</span>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '15px' }}>{firstName}</div>
          </div>
          <button onClick={onLogout} className="btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }}>Salir</button>
        </header>
      )}

      {/* ── SIDEBAR ESCRITORIO ── */}
      {!isMobile && (
        <aside style={{ width: '220px', minWidth: '220px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>🧬</span>
              <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '15px' }}>Peptivita</span>
            </div>
            <div style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 600, marginBottom: '2px' }}>BIENVENIDO/A</div>
              <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }}>{patient.full_name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>CI: {patient.cedula}</div>
            </div>
          </div>
          <nav style={{ flex: 1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === t.id ? 'var(--green-dim)' : 'transparent', color: tab === t.id ? 'var(--green)' : 'var(--text-secondary)', fontSize: '14px', fontWeight: tab === t.id ? 600 : 400, marginBottom: '4px', textAlign: 'left', transition: 'all 0.15s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
          <button onClick={onLogout} className="btn-ghost" style={{ width: '100%', padding: '8px', fontSize: '13px' }}>Cerrar sesión</button>
        </aside>
      )}

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main style={{ 
        flex: 1, overflowY: 'auto', overflowX: 'hidden', 
        padding: isMobile ? '20px 16px calc(80px + env(safe-area-inset-bottom)) 16px' : '32px',
        WebkitOverflowScrolling: 'touch' // Suaviza el scroll en Safari iOS
      }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: isMobile ? '20px' : '28px' }}>
              <h1 style={{ fontFamily: 'DM Sans', fontSize: isMobile ? '22px' : '26px', fontWeight: 700, margin: '0 0 4px' }}>
                Hola, {firstName} 👋
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Tu resumen de progreso</p>
            </div>

            {latestNotes && (
              <div style={{ background: 'linear-gradient(135deg, rgba(0,200,255,0.08), rgba(0,229,160,0.08))', border: '1px solid var(--cyan)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--cyan)', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>📋 NOTAS DEL ESPECIALISTA</div>
                <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px' }}>{latestNotes}</p>
              </div>
            )}

            {/* KPIs adaptables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: isMobile ? '12px' : '16px', marginBottom: '24px' }}>
              <KPICard icon="⚖️" label="Peso Actual" value={currentWeight ? `${currentWeight} kg` : '—'} sub={initialWeight ? `Inicial: ${initialWeight} kg` : undefined} color="var(--cyan)" />
              <KPICard icon="🔥" label="Grasa Corporal" value={latestAnthro?.body_fat_pct ? `${latestAnthro.body_fat_pct}%` : '—'} sub={patient.goal_fat_pct ? `Meta: ${patient.goal_fat_pct}%` : undefined} color="var(--amber)" />
              <KPICard icon="📉" label="Peso Perdido" value={pctLost ? `${pctLost}%` : '—'} sub={pctLost ? `${(Number(pctLost)/100*(initialWeight||0)).toFixed(1)} kg totales` : undefined} color="var(--green)" />
              <KPICard icon="💪" label="Masa Muscular" value={latestAnthro?.muscle_mass_kg ? `${latestAnthro.muscle_mass_kg} kg` : '—'} color="var(--purple)" />
              {whr && <KPICard icon="📐" label="ICC" value={whr.toFixed(3)} sub={whrClass?.label} color={whrClass?.color || 'var(--cyan)'} />}
            </div>

            {/* Progreso */}
            {progressToGoal !== null && (
              <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>🎯 Hacia tu meta</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{progressToGoal.toFixed(0)}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${progressToGoal}%` }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Inicio: {initialWeight} kg</span><span>Meta: {goalWeight} kg</span>
                </div>
              </div>
            )}

            {/* Widget IMC */}
            {latestAnthro?.weight_kg && latestAnthro?.height_cm && (
              <IMCPatientWidget weight={latestAnthro.weight_kg} height={latestAnthro.height_cm} goalWeight={patient.goal_weight} initialWeight={initialWeight} isMobile={isMobile} />
            )}

            {/* Gráficos apilados en móvil */}
            {chartData.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <ChartCard title="📈 Evolución de Peso" color="#00C8FF">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00C8FF" stopOpacity={0.3}/><stop offset="95%" stopColor="#00C8FF" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={30} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="peso" stroke="#00C8FF" fill="url(#wGrad)" strokeWidth={2} name="Peso (kg)" />
                  </AreaChart>
                </ChartCard>
                <ChartCard title="🔥 % Grasa Corporal" color="#FFB547">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFB547" stopOpacity={0.3}/><stop offset="95%" stopColor="#FFB547" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={30} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="grasa" stroke="#FFB547" fill="url(#fGrad)" strokeWidth={2} name="% Grasa" />
                  </AreaChart>
                </ChartCard>
              </div>
            )}

            {/* Péptidos */}
            {activePeptides.length > 0 && (
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'DM Sans', fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>💉 Tratamiento Activo</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {activePeptides.map((pep: any) => (
                    <div key={pep.id} style={{ background: 'var(--bg-elevated)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--cyan)' }}>{pep.peptide_name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        <div>💊 Dosis: <b>{pep.dose_value} {pep.dose_unit}</b></div>
                        <div>🔄 Frecuencia: <b>{pep.frequency}</b></div>
                        <div>💉 Vía: <b>{pep.administration_route}</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMPONENTES SECUNDARIOS PASANDO isMobile ── */}
        {tab === 'labs' && <LabPanel labResults={labResults} isMobile={isMobile} />}
        {tab === 'photos' && <PhotosPanel photos={photos} isMobile={isMobile} />}
        {tab === 'history' && <HistoryPanel consultations={consultations} anthropoHistory={anthropoHistory} isMobile={isMobile} />}
      </main>

      {/* ── NAVEGACIÓN INFERIOR MÓVIL (iOS Safe Area) ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          height: 'calc(65px + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 1000, boxShadow: '0 -4px 20px rgba(0,0,0,0.4)'
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '8px', border: 'none', background: 'none', flex: 1,
                color: tab === t.id ? 'var(--green)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}>
              <span style={{ fontSize: '20px', filter: tab === t.id ? 'drop-shadow(0 0 6px rgba(0,229,160,0.4))' : 'none', opacity: tab === t.id ? 1 : 0.5 }}>{t.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: tab === t.id ? 700 : 500 }}>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

// ── Sub-components ajustados para móvil ───────────────────────────────────────────

function KPICard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '2px' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function ChartCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <h3 style={{ fontFamily: 'DM Sans', fontSize: '14px', fontWeight: 700, margin: '0 0 16px' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={180}>{children as any}</ResponsiveContainer>
    </div>
  )
}

function LabPanel({ labResults, isMobile }: { labResults: any[], isMobile: boolean }) {
  const [selectedParam, setSelectedParam] = useState<string | null>(null)
  const grouped: Record<string, any[]> = {}
  labResults.forEach((lr: any) => {
    const key = lr.custom_parameter || String(lr.parameter_id)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(lr)
  })
  const params = Object.keys(grouped)
  const classColors: Record<string, string> = { NORMAL: 'var(--green)', LOW: 'var(--cyan)', HIGH: 'var(--red)', UNCLASSIFIED: 'var(--text-muted)' }
  const classBg: Record<string, string> = { NORMAL: 'var(--green-dim)', LOW: 'var(--cyan-dim)', HIGH: 'var(--red-dim)', UNCLASSIFIED: 'var(--bg-elevated)' }

  return (
    <div>
      <h1 style={{ fontFamily: 'DM Sans', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: '0 0 20px' }}>🧪 Laboratorio</h1>
      {params.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Aún no hay resultados de laboratorio.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {params.map(param => {
          const entries = grouped[param]
          const latest = entries[entries.length - 1]
          const cls = latest.classification || 'UNCLASSIFIED'
          return (
            <button key={param} onClick={() => setSelectedParam(selectedParam === param ? null : param)}
              style={{ background: selectedParam === param ? classBg[cls] : 'var(--bg-card)', border: `1px solid ${selectedParam === param ? classColors[cls] : 'var(--border)'}`, borderRadius: '10px', padding: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{param}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'JetBrains Mono', color: classColors[cls] }}>{latest.value_numeric ?? latest.value_text ?? '—'}</div>
            </button>
          )
        })}
      </div>
      {selectedParam && grouped[selectedParam].length > 1 && (
        <div className="glass-card" style={{ padding: '16px' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '14px', fontWeight: 700, margin: '0 0 16px' }}>Evolución: {selectedParam}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={grouped[selectedParam].map((lr: any) => ({ date: lr.consultations?.consultation_date?.slice(0, 10), valor: lr.value_numeric }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="valor" stroke="var(--cyan)" strokeWidth={2} dot={{ fill: 'var(--cyan)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function PhotosPanel({ photos, isMobile }: { photos: any[], isMobile: boolean }) {
  const [compareMode, setCompareMode] = useState(false)
  const byAngle = { front: photos.filter((p: any) => p.angle === 'front'), side: photos.filter((p: any) => p.angle === 'side'), back: photos.filter((p: any) => p.angle === 'back') }
  function getUrl(path: string) { const { data } = supabase.storage.from('progress-photos').getPublicUrl(path); return data.publicUrl }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <h1 style={{ fontFamily: 'DM Sans', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: 0 }}>📸 Progreso</h1>
        <button className="btn-ghost" onClick={() => setCompareMode(!compareMode)} style={{ fontSize: '12px' }}>
          {compareMode ? '📋 Ver Galería' : '🔁 Comparar Antes/Después'}
        </button>
      </div>
      {(['front','side','back'] as const).map(angle => {
        const anglePhotos = byAngle[angle]
        if (!anglePhotos.length) return null
        const labels = { front: 'Frente', side: 'Perfil', back: 'Espalda' }
        return (
          <div key={angle} style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>{labels[angle].toUpperCase()}</h3>
            {compareMode && anglePhotos.length >= 2 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '500px' }}>
                {[anglePhotos[anglePhotos.length - 1], anglePhotos[0]].map((ph: any, idx: number) => (
                  <div key={ph.id}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>{idx === 0 ? '✅ ACTUAL' : '⏮ INICIAL'}</div>
                    <img src={getUrl(ph.storage_path)} alt={angle} style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', aspectRatio: '3/4', border: '2px solid var(--border)' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', WebkitOverflowScrolling: 'touch' }}>
                {anglePhotos.map((ph: any) => (
                  <div key={ph.id} style={{ minWidth: isMobile ? '130px' : '150px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{ph.photo_date}</div>
                    <img src={getUrl(ph.storage_path)} alt={angle} style={{ width: '100%', aspectRatio: '3/4', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HistoryPanel({ consultations, anthropoHistory, isMobile }: { consultations: any[]; anthropoHistory: any[]; isMobile: boolean }) {
  const [compareA, setCompareA] = useState<string | null>(null)
  const [compareB, setCompareB] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'compare'>('list')

  const sorted = [...consultations].reverse()

  const fields = [
    { key: 'weight_kg',      label: 'Peso',          unit: 'kg',  better: 'down' },
    { key: 'body_fat_pct',   label: '% Grasa',       unit: '%',   better: 'down' },
    { key: 'muscle_mass_kg', label: 'Músculo',       unit: 'kg',  better: 'up'   },
    { key: 'waist_cm',       label: 'Cintura',       unit: 'cm',  better: 'down' },
    { key: 'bmi',            label: 'IMC',           unit: '',    better: 'down' },
  ]

  function getAnthro(consultId: string) { return anthropoHistory.find((a: any) => a.consultation_id === consultId) }

  function getDiff(valA: number, valB: number, better: string) {
    const diff = valB - valA
    if (diff === 0) return { text: '=', color: 'var(--text-muted)' }
    if (better === 'down') return diff < 0
      ? { text: `▼${Math.abs(diff).toFixed(1)}`, color: 'var(--green)' }
      : { text: `▲${diff.toFixed(1)}`, color: 'var(--red)' }
    return diff > 0
      ? { text: `▲${diff.toFixed(1)}`, color: 'var(--green)' }
      : { text: `▼${Math.abs(diff).toFixed(1)}`, color: 'var(--red)' }
  }

  const anthroA = compareA ? getAnthro(compareA) : null
  const anthroB = compareB ? getAnthro(compareB) : null
  const consultA = compareA ? consultations.find((c: any) => c.id === compareA) : null
  const consultB = compareB ? consultations.find((c: any) => c.id === compareB) : null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <h1 style={{ fontFamily: 'DM Sans', fontSize: isMobile ? '20px' : '24px', fontWeight: 700, margin: 0 }}>📋 Historial</h1>
        {consultations.length >= 2 && (
          <button className="btn-ghost" onClick={() => setMode(mode === 'list' ? 'compare' : 'list')} style={{ fontSize: '12px' }}>
            {mode === 'list' ? '⚖️ Comparar' : '📋 Ver Lista'}
          </button>
        )}
      </div>

      {mode === 'compare' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[{ label: 'Consulta A (Base)', val: compareA, set: setCompareA, color: 'var(--cyan)' },
              { label: 'Consulta B (Comparar)', val: compareB, set: setCompareB, color: 'var(--green)' }].map(col => (
              <div key={col.label}>
                <div style={{ fontSize: '12px', color: col.color, fontWeight: 700, marginBottom: '6px' }}>{col.label}</div>
                <select className="input-dark" value={col.val || ''} onChange={e => col.set(e.target.value || null)}>
                  <option value="">— Seleccionar —</option>
                  {sorted.map((c: any, i: number) => (
                    <option key={c.id} value={c.id}>#{sorted.length - i} · {c.consultation_date}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {anthroA && anthroB && (
            <div className="glass-card" style={{ padding: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: isMobile ? '320px' : 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MEDICIÓN</div>
                  <div style={{ fontSize: '10px', color: 'var(--cyan)', textAlign: 'center' }}>{consultA?.consultation_date.slice(5)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--green)', textAlign: 'center' }}>{consultB?.consultation_date.slice(5)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>DIF</div>
                </div>
                {fields.map(f => {
                  const vA = anthroA[f.key], vB = anthroB[f.key]
                  if (!vA && !vB) return null
                  const diff = vA && vB ? getDiff(Number(vA), Number(vB), f.better) : null
                  return (
                    <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', borderTop: '1px solid var(--border)', padding: '10px 0' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.label}</div>
                      <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'var(--cyan)' }}>{vA ? Number(vA).toFixed(1) : '—'}</div>
                      <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'var(--green)' }}>{vB ? Number(vB).toFixed(1) : '—'}</div>
                      <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: diff?.color || 'var(--text-muted)' }}>{diff?.text || '—'}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'list' && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {sorted.map((c: any, i: number) => {
            const anthro = getAnthro(c.id)
            const [isOpen, setIsOpen] = useState(i === 0)
            return (
              <div key={c.id} className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                <button onClick={() => setIsOpen(!isOpen)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Consulta #{sorted.length - i}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{c.consultation_date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {anthro?.weight_kg && !isMobile && <span style={{ fontSize: '13px', color: 'var(--cyan)', fontFamily: 'JetBrains Mono' }}>{anthro.weight_kg}kg</span>}
                    <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    {anthro && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', paddingTop: '12px' }}>
                        {fields.map(f => {
                          const val = anthro[f.key]
                          if (!val) return null
                          return (
                            <div key={f.key} style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '8px' }}>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>{f.label}</div>
                              <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', fontSize: '13px' }}>{Number(val).toFixed(1)}{f.unit}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {c.notes_specialist && (
                      <div style={{ marginTop: '12px', background: 'var(--cyan-dim)', borderRadius: '8px', padding: '12px', borderLeft: '3px solid var(--cyan)', fontSize: '13px', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--cyan)' }}>Nota:</strong> {c.notes_specialist}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}