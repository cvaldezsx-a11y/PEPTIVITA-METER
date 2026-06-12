'use client'

import { useState, useEffect } from 'react'
import { supabase, type Patient, classifyWHR, classifyFrameSize } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'

type Tab = 'dashboard' | 'labs' | 'photos' | 'history'


// ── IMC Widget para el Dashboard del Paciente ─────────────
function IMCPatientWidget({ weight, height, goalWeight, initialWeight }: {
  weight: number; height: number; goalWeight?: number; initialWeight?: number
}) {
  const imc = weight / Math.pow(height / 100, 2)
  const idealMin = Math.round(20 * Math.pow(height / 100, 2) * 10) / 10
  const idealMax = Math.round(25 * Math.pow(height / 100, 2) * 10) / 10

  type IMCCat = { label: string; color: string; emoji: string; msg: string }
  function getCategory(imc: number): IMCCat {
    if (imc < 18.5) return { label: 'Bajo peso',    color: 'var(--cyan)',  emoji: '💙', msg: 'Estás trabajando para alcanzar tu peso óptimo. ¡Cada consulta te acerca más!' }
    if (imc < 25)   return { label: 'Normal',        color: 'var(--green)', emoji: '💚', msg: '¡Estás en tu rango ideal! Mantén el ritmo, tu cuerpo te lo agradece.' }
    if (imc < 30)   return { label: 'Sobrepeso',     color: 'var(--amber)', emoji: '🌟', msg: 'Vas por buen camino. Cada kg menos es una victoria para tu salud.' }
    if (imc < 35)   return { label: 'Obesidad I',    color: '#FF8C42',      emoji: '🔥', msg: '¡Tu dedicación está dando resultados! Sigue con el plan, los cambios se notan.' }
    if (imc < 40)   return { label: 'Obesidad II',   color: 'var(--red)',   emoji: '💪', msg: 'El camino es largo pero ya empezaste. Cada paso cuenta, ¡no pares!' }
    return           { label: 'Obesidad III',  color: 'var(--red)',   emoji: '🚀', msg: 'Has dado el paso más importante: comenzar. Tu equipo médico está contigo.' }
  }

  const cat = getCategory(imc)
  const diff = weight - idealMax
  const kgToIdeal = diff > 0 ? diff : 0

  // Progreso hacia peso ideal
  let progressPct = 100
  if (initialWeight && initialWeight > idealMax && diff > 0) {
    const totalToLose = initialWeight - idealMax
    const lost = initialWeight - weight
    progressPct = Math.min(100, Math.max(0, (lost / totalToLose) * 100))
  } else if (diff <= 0) {
    progressPct = 100
  }

  // Barra de IMC visual (rango 15-45)
  const imcBarPct = Math.min(100, Math.max(0, ((imc - 15) / 30) * 100))

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${cat.color}40`,
      borderRadius: '16px', padding: '24px', marginBottom: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow de fondo */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '160px', height: '160px', borderRadius: '50%',
        background: `${cat.color}10`, filter: 'blur(40px)',
      }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', position: 'relative' }}>
        {/* Columna izquierda: IMC */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>
            ÍNDICE DE MASA CORPORAL
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '42px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: cat.color, lineHeight: 1 }}>
              {imc.toFixed(1)}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kg/m²</span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: `${cat.color}20`, color: cat.color,
            padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '12px',
          }}>
            {cat.emoji} {cat.label}
          </div>

          {/* Barra IMC con zonas de color */}
          <div style={{ position: 'relative', marginBottom: '6px' }}>
            <div style={{ height: '10px', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '23%', background: 'var(--cyan)',  opacity: 0.7 }} />
              <div style={{ width: '22%', background: 'var(--green)', opacity: 0.7 }} />
              <div style={{ width: '17%', background: 'var(--amber)', opacity: 0.7 }} />
              <div style={{ width: '17%', background: '#FF8C42',      opacity: 0.7 }} />
              <div style={{ width: '21%', background: 'var(--red)',   opacity: 0.7 }} />
            </div>
            {/* Indicador */}
            <div style={{
              position: 'absolute', top: '-3px',
              left: `calc(${imcBarPct}% - 8px)`,
              width: '16px', height: '16px', borderRadius: '50%',
              background: cat.color, border: '2px solid var(--bg-deep)',
              transition: 'left 0.5s ease', boxShadow: `0 0 8px ${cat.color}`,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>15</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>45</span>
          </div>

          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Rango ideal: <span style={{ color: 'var(--green)', fontWeight: 600 }}>{idealMin} – {idealMax} kg</span>
          </div>
        </div>

        {/* Columna derecha: Progreso al peso ideal */}
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>
            PROGRESO HACIA PESO IDEAL
          </div>

          {progressPct >= 100 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏆</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)' }}>¡Meta alcanzada!</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Estás en tu rango de peso ideal
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>
                  {progressPct.toFixed(0)}%
                </span>
                {kgToIdeal > 0 && (
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Faltan <b style={{ color: 'var(--amber)' }}>{kgToIdeal.toFixed(1)} kg</b>
                  </span>
                )}
              </div>

              {/* Barra de progreso animada */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '999px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                  height: '100%', borderRadius: '999px',
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, var(--cyan), var(--green))`,
                  transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: '0 0 10px rgba(0,229,160,0.4)',
                }} />
              </div>

              {/* Mensajes de hitos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <span>Inicio</span><span>25%</span><span>50%</span><span>75%</span><span>Meta ✓</span>
              </div>
            </div>
          )}

          {/* Mensaje motivacional */}
          <div style={{
            background: `${cat.color}12`,
            border: `1px solid ${cat.color}30`,
            borderRadius: '10px', padding: '12px',
            fontSize: '13px', color: 'var(--text-secondary)',
            lineHeight: '1.5', fontStyle: 'italic',
          }}>
            {cat.emoji} {cat.msg}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PatientDashboard({
  patient, onLogout
}: {
  patient: Patient
  onLogout: () => void
}) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [consultations, setConsultations] = useState<any[]>([])
  const [anthropoHistory, setAnthroHistory] = useState<any[]>([])
  const [latestAnthro, setLatestAnthro] = useState<any>(null)
  const [latestNotes, setLatestNotes] = useState<string>('')
  const [activePeptides, setActivePeptides] = useState<any[]>([])
  const [labResults, setLabResults] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)

    // Consultas ordenadas cronológicamente
    const { data: consults } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patient.id)
      .order('consultation_date', { ascending: true })
    setConsultations(consults || [])

    if (consults && consults.length > 0) {
      const ids = consults.map(c => c.id)
      const latest = consults[consults.length - 1]
      setLatestNotes(latest.notes_specialist || '')

      // Historial antropométrico
      const { data: anthros } = await supabase
        .from('anthropometrics')
        .select('*, consultations(consultation_date)')
        .in('consultation_id', ids)
        .order('consultations(consultation_date)', { ascending: true })
      setAnthroHistory(anthros || [])
      if (anthros && anthros.length > 0) setLatestAnthro(anthros[anthros.length - 1])

      // Péptidos activos
      const { data: peps } = await supabase
        .from('peptide_treatments')
        .select('*')
        .in('consultation_id', ids)
        .eq('is_active', true)
      setActivePeptides(peps || [])

      // Resultados de laboratorio
      const { data: labs } = await supabase
        .from('lab_results')
        .select('*, consultations(consultation_date)')
        .in('consultation_id', ids)
        .order('consultations(consultation_date)', { ascending: true })
      setLabResults(labs || [])

      // Fotos
      const { data: ph } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('patient_id', patient.id)
        .order('photo_date', { ascending: false })
      setPhotos(ph || [])
    }

    setLoading(false)
  }

  // KPIs calculados
  const initialWeight = patient.initial_weight || anthropoHistory[0]?.weight_kg
  const currentWeight = latestAnthro?.weight_kg
  const pctLost = initialWeight && currentWeight
    ? ((initialWeight - currentWeight) / initialWeight * 100).toFixed(1)
    : null
  const goalWeight = patient.goal_weight
  const progressToGoal = initialWeight && goalWeight && currentWeight
    ? Math.min(100, Math.max(0, ((initialWeight - currentWeight) / (initialWeight - goalWeight) * 100)))
    : null

  const whr = latestAnthro?.waist_hip_ratio
  const whrClass = whr && patient.gender ? classifyWHR(whr, patient.gender as any) : null
  const frameSize = latestAnthro?.height_cm && latestAnthro?.wrist_cm
    ? classifyFrameSize(latestAnthro.height_cm, latestAnthro.wrist_cm, patient.gender as any)
    : null

  // Datos de gráfico peso/grasa
  const chartData = anthropoHistory.map(a => ({
    date: a.consultations?.consultation_date?.slice(0, 10) || '',
    peso: a.weight_kg,
    grasa: a.body_fat_pct,
    musculo: a.muscle_mass_kg,
  }))

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'labs',      icon: '🧪', label: 'Laboratorio' },
    { id: 'photos',    icon: '📸', label: 'Progreso' },
    { id: 'history',   icon: '📋', label: 'Historial' },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>🧬</div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando tu dashboard...</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-deep)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px', minWidth: '220px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px' }}>🧬</span>
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '15px' }}>Peptivita</span>
          </div>
          <div style={{
            background: 'var(--cyan-dim)', border: '1px solid var(--cyan)',
            borderRadius: '10px', padding: '12px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 600, marginBottom: '2px' }}>BIENVENIDO/A</div>
            <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }}>{patient.full_name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>CI: {patient.cedula}</div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: tab === t.id ? 'var(--green-dim)' : 'transparent',
                color: tab === t.id ? 'var(--green)' : 'var(--text-secondary)',
                fontSize: '14px', fontWeight: tab === t.id ? 600 : 400,
                marginBottom: '4px', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <button onClick={onLogout} className="btn-ghost" style={{ width: '100%', padding: '8px', fontSize: '13px' }}>
          Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontFamily: 'DM Sans', fontSize: '26px', fontWeight: 700, margin: '0 0 4px' }}>
                Hola, {patient.full_name.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                Tu resumen de progreso actualizado
              </p>
            </div>

            {/* Notas del especialista */}
            {latestNotes && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,200,255,0.08), rgba(0,229,160,0.08))',
                border: '1px solid var(--cyan)',
                borderRadius: '12px', padding: '20px', marginBottom: '24px',
              }}>
                <div style={{ fontSize: '12px', color: 'var(--cyan)', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>
                  📋 NOTAS DE TU ESPECIALISTA
                </div>
                <p style={{ margin: 0, lineHeight: '1.7', fontSize: '15px' }}>{latestNotes}</p>
              </div>
            )}

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <KPICard
                icon="⚖️" label="Peso Actual"
                value={currentWeight ? `${currentWeight} kg` : '—'}
                sub={initialWeight ? `Inicial: ${initialWeight} kg` : undefined}
                color="var(--cyan)"
              />
              <KPICard
                icon="🔥" label="Grasa Corporal"
                value={latestAnthro?.body_fat_pct ? `${latestAnthro.body_fat_pct}%` : '—'}
                sub={patient.goal_fat_pct ? `Meta: ${patient.goal_fat_pct}%` : undefined}
                color="var(--amber)"
              />
              <KPICard
                icon="📉" label="Peso Perdido"
                value={pctLost ? `${pctLost}%` : '—'}
                sub={pctLost ? `${(Number(pctLost)/100*(initialWeight||0)).toFixed(1)} kg totales` : undefined}
                color="var(--green)"
              />
              <KPICard
                icon="💪" label="Masa Muscular"
                value={latestAnthro?.muscle_mass_kg ? `${latestAnthro.muscle_mass_kg} kg` : '—'}
                color="var(--purple)"
              />
              {whr && (
                <KPICard
                  icon="📐" label="ICC"
                  value={whr.toFixed(3)}
                  sub={whrClass?.label}
                  color={whrClass?.color || 'var(--cyan)'}
                />
              )}
              {frameSize && (
                <KPICard icon="🦴" label="Constitución Ósea" value={frameSize} color="var(--text-secondary)" />
              )}
            </div>

            {/* Progress bar hacia la meta */}
            {progressToGoal !== null && (
              <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>🎯 Progreso hacia tu meta</span>
                  <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                    {progressToGoal.toFixed(0)}%
                  </span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressToGoal}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Inicio: {initialWeight} kg</span>
                  <span>Meta: {goalWeight} kg</span>
                </div>
              </div>
            )}

            {/* Gráficos de evolución */}
            {chartData.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <ChartCard title="📈 Evolución de Peso" color="#00C8FF">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C8FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00C8FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="peso" stroke="#00C8FF" fill="url(#wGrad)" strokeWidth={2} name="Peso (kg)" />
                  </AreaChart>
                </ChartCard>

                <ChartCard title="🔥 % Grasa Corporal" color="#FFB547">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFB547" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FFB547" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="grasa" stroke="#FFB547" fill="url(#fGrad)" strokeWidth={2} name="% Grasa" />
                  </AreaChart>
                </ChartCard>
              </div>
            )}

            {/* IMC + Peso Ideal Widget */}
            {latestAnthro?.weight_kg && latestAnthro?.height_cm && (
              <IMCPatientWidget
                weight={latestAnthro.weight_kg}
                height={latestAnthro.height_cm}
                goalWeight={patient.goal_weight}
                initialWeight={initialWeight}
              />
            )}

            {/* Tratamiento activo */}
            {activePeptides.length > 0 && (
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'DM Sans', fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>
                  💉 Tratamiento Activo con Péptidos
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {activePeptides.map(pep => (
                    <div key={pep.id} style={{
                      background: 'var(--bg-elevated)', borderRadius: '10px',
                      padding: '16px', border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--cyan)' }}>{pep.peptide_name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        <div>💊 Dosis: <b>{pep.dose_value} {pep.dose_unit}</b></div>
                        <div>🔄 Frecuencia: <b>{pep.frequency}</b></div>
                        <div>💉 Vía: <b>{pep.administration_route}</b></div>
                        {pep.cycle_start && <div>📅 Ciclo: {pep.cycle_start} → {pep.cycle_end || 'en curso'}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── LABORATORIO ── */}
        {tab === 'labs' && <LabPanel labResults={labResults} />}

        {/* ── FOTOS ── */}
        {tab === 'photos' && <PhotosPanel photos={photos} />}

        {/* ── HISTORIAL ── */}
        {tab === 'history' && (
          <HistoryPanel consultations={consultations} anthropoHistory={anthropoHistory} />
        )}
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function KPICard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function ChartCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <h3 style={{ fontFamily: 'DM Sans', fontSize: '15px', fontWeight: 700, margin: '0 0 16px' }}>{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        {children as any}
      </ResponsiveContainer>
    </div>
  )
}

function LabPanel({ labResults }: { labResults: any[] }) {
  const [selectedParam, setSelectedParam] = useState<string | null>(null)

  // Agrupar por parámetro
  const grouped: Record<string, any[]> = {}
  labResults.forEach(lr => {
    const key = lr.custom_parameter || lr.parameter_id
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(lr)
  })

  const params = Object.keys(grouped)

  const classColors: Record<string, string> = {
    NORMAL: 'var(--green)', LOW: 'var(--cyan)', HIGH: 'var(--red)', UNCLASSIFIED: 'var(--text-muted)'
  }
  const classBg: Record<string, string> = {
    NORMAL: 'var(--green-dim)', LOW: 'var(--cyan-dim)', HIGH: 'var(--red-dim)', UNCLASSIFIED: 'var(--bg-elevated)'
  }
  const classLabel: Record<string, string> = { NORMAL: 'Normal', LOW: 'Bajo', HIGH: 'Alto', UNCLASSIFIED: '—' }

  return (
    <div>
      <h1 style={{ fontFamily: 'DM Sans', fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>
        🧪 Exámenes de Laboratorio
      </h1>

      {params.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>Aún no hay resultados de laboratorio registrados.</p>
      )}

      {/* Latest values grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {params.map(param => {
          const entries = grouped[param]
          const latest = entries[entries.length - 1]
          const cls = latest.classification || 'UNCLASSIFIED'
          return (
            <button key={param}
              onClick={() => setSelectedParam(selectedParam === param ? null : param)}
              style={{
                background: selectedParam === param ? classBg[cls] : 'var(--bg-card)',
                border: `1px solid ${selectedParam === param ? classColors[cls] : 'var(--border)'}`,
                borderRadius: '10px', padding: '16px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{param}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'JetBrains Mono', color: classColors[cls] }}>
                {latest.value_numeric ?? latest.value_text ?? '—'}
              </div>
              <div style={{ marginTop: '6px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
                  background: classBg[cls], color: classColors[cls],
                }}>
                  {classLabel[cls]}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Evolution chart for selected param */}
      {selectedParam && grouped[selectedParam].length > 1 && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'DM Sans', fontSize: '16px', fontWeight: 700, margin: '0 0 16px' }}>
            Evolución: {selectedParam}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={grouped[selectedParam].map(lr => ({
              date: lr.consultations?.consultation_date?.slice(0, 10),
              valor: lr.value_numeric,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="valor" stroke="var(--cyan)" strokeWidth={2} dot={{ fill: 'var(--cyan)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function PhotosPanel({ photos }: { photos: any[] }) {
  const [compareMode, setCompareMode] = useState(false)

  const byAngle = {
    front: photos.filter(p => p.angle === 'front'),
    side:  photos.filter(p => p.angle === 'side'),
    back:  photos.filter(p => p.angle === 'back'),
  }

  const { data: urlHelper } = { data: { publicUrl: '' } }

  function getUrl(path: string) {
    const { data } = supabase.storage.from('progress-photos').getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'DM Sans', fontSize: '24px', fontWeight: 700, margin: 0 }}>
          📸 Fotos de Progreso
        </h1>
        <button className="btn-ghost" onClick={() => setCompareMode(!compareMode)} style={{ fontSize: '13px' }}>
          {compareMode ? '📋 Ver Galería' : '🔁 Comparar Antes/Después'}
        </button>
      </div>

      {(['front','side','back'] as const).map(angle => {
        const anglePhotos = byAngle[angle]
        if (!anglePhotos.length) return null
        const labels = { front: 'Frente', side: 'Perfil', back: 'Espalda' }
        return (
          <div key={angle} style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.5px' }}>
              {labels[angle].toUpperCase()}
            </h3>
            {compareMode && anglePhotos.length >= 2 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '500px' }}>
                {[anglePhotos[anglePhotos.length - 1], anglePhotos[0]].map((ph, idx) => (
                  <div key={ph.id}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                      {idx === 0 ? '✅ ACTUAL' : '⏮ INICIAL'} · {ph.photo_date}
                    </div>
                    <img src={getUrl(ph.storage_path)} alt={angle}
                      style={{ width: '100%', borderRadius: '10px', objectFit: 'cover', aspectRatio: '3/4', border: '2px solid var(--border)' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                {anglePhotos.map(ph => (
                  <div key={ph.id} style={{ minWidth: '150px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{ph.photo_date}</div>
                    <img src={getUrl(ph.storage_path)} alt={angle}
                      style={{ width: '150px', height: '200px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {photos.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>Aún no se han cargado fotos de progreso.</p>
      )}
    </div>
  )
}

function HistoryPanel({ consultations, anthropoHistory }: { consultations: any[]; anthropoHistory: any[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const sorted = [...consultations].reverse()

  return (
    <div>
      <h1 style={{ fontFamily: 'DM Sans', fontSize: '24px', fontWeight: 700, margin: '0 0 24px' }}>
        📋 Historial de Consultas
      </h1>
      {sorted.map((c, i) => {
        const anthro = anthropoHistory.find(a => a.consultation_id === c.id)
        const isOpen = openId === c.id
        return (
          <div key={c.id} className="glass-card" style={{ marginBottom: '10px', overflow: 'hidden' }}>
            <button
              onClick={() => setOpenId(isOpen ? null : c.id)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div>
                <span style={{ fontWeight: 700, marginRight: '16px' }}>Consulta #{sorted.length - i}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{c.consultation_date}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {anthro?.weight_kg && (
                  <span style={{ fontSize: '14px', color: 'var(--cyan)', fontFamily: 'JetBrains Mono' }}>
                    {anthro.weight_kg} kg
                  </span>
                )}
                {anthro?.body_fat_pct && (
                  <span style={{ fontSize: '14px', color: 'var(--amber)', fontFamily: 'JetBrains Mono' }}>
                    {anthro.body_fat_pct}% GC
                  </span>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && anthro && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', paddingTop: '16px' }}>
                  {[
                    ['Peso', `${anthro.weight_kg} kg`],
                    ['Altura', `${anthro.height_cm} cm`],
                    ['% Grasa', `${anthro.body_fat_pct}%`],
                    ['Masa Muscular', `${anthro.muscle_mass_kg} kg`],
                    ['Cintura', `${anthro.waist_cm} cm`],
                    ['Cadera', `${anthro.hip_cm} cm`],
                    ['ICC', anthro.waist_hip_ratio?.toFixed(3)],
                    ['IMC', anthro.bmi?.toFixed(1)],
                  ].filter(([,v]) => v && v !== 'undefined').map(([label, value]) => (
                    <div key={label as string} style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {c.notes_specialist && (
                  <div style={{
                    marginTop: '16px', background: 'var(--cyan-dim)', borderRadius: '8px', padding: '12px',
                    borderLeft: '3px solid var(--cyan)', fontSize: '14px', lineHeight: 1.6,
                  }}>
                    <strong style={{ color: 'var(--cyan)' }}>Nota del especialista:</strong>{' '}
                    {c.notes_specialist}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
