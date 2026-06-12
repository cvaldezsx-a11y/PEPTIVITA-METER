import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Este endpoint crea el usuario de Supabase Auth para que el paciente pueda hacer login
// Usa la SERVICE_ROLE key (solo disponible en servidor, nunca en cliente)
export async function POST(req: Request) {
  const { cedula, patientId } = await req.json()

  if (!cedula || !patientId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // El email interno es: cedula@peptivita.local
  // La contraseña inicial es la cedula misma (el paciente debe cambiarla)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `${cedula}@peptivita.local`,
    password: cedula,            // contraseña inicial = cédula
    email_confirm: true,
    user_metadata: { cedula, patientId, role: 'patient' },
  })

  if (error) {
    // Si el usuario ya existe, no es error crítico
    if (error.message.includes('already been registered')) {
      return NextResponse.json({ ok: true, existing: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: data.user.id })
}
