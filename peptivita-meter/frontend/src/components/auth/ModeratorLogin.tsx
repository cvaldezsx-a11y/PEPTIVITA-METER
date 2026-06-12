'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import ModeratorPanel from '@/components/moderator/ModeratorPanel'

export default function ModeratorLogin({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [moderator, setModerator] = useState<any>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Login con Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw new Error('Credenciales incorrectas: ' + authError.message)

      const uid = data.user?.id
      if (!uid) throw new Error('No se pudo obtener el usuario')

      // 2. Buscar moderador — usar maybeSingle para no lanzar error si no existe
      const { data: modData, error: modError } = await supabase
        .from('moderators')
        .select('*')
        .eq('supabase_uid', uid)
        .eq('is_active', true)
        .maybeSingle()

      if (modError) throw new Error('Error al verificar moderador: ' + modError.message)
      if (!modData) throw new Error(`No tienes acceso como moderador. UID: ${uid}`)

      setModerator(modData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (moderator) return <ModeratorPanel moderator={moderator} onLogout={() => { setModerator(null); supabase.auth.signOut() }} />

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
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '24px', padding: 0 }}
        >
          ← Volver
        </button>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚕️</div>
          <h1 style={{ fontFamily: 'DM Sans', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' }}>
            Acceso Moderador
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Área restringida para especialistas
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input className="input-dark" type="email" placeholder="medico@clinica.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input className="input-dark" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: '8px', padding: '12px', marginBottom: '16px',
              color: 'var(--red)', fontSize: '13px', wordBreak: 'break-all',
            }}>{error}</div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Verificando...' : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
