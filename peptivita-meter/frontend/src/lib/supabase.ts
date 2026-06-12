import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── TYPES ──────────────────────────────────────────────────

export type Patient = {
  id: string
  cedula: string
  full_name: string
  email?: string
  phone?: string
  birth_date?: string
  gender?: 'M' | 'F' | 'Other'
  goal_weight?: number
  goal_fat_pct?: number
  initial_weight?: number
  notes_general?: string
  is_active: boolean
  created_at: string
}

export type Consultation = {
  id: string
  patient_id: string
  moderator_id?: string
  consultation_date: string
  notes_specialist?: string
  created_at: string
}

export type Anthropometric = {
  id: string
  consultation_id: string
  age?: number
  height_cm?: number
  weight_kg?: number
  neck_cm?: number
  wrist_cm?: number
  bicep_left_cm?: number
  bicep_right_cm?: number
  chest_cm?: number
  waist_cm?: number
  hip_cm?: number
  thigh_left_cm?: number
  thigh_right_cm?: number
  body_fat_pct?: number
  muscle_mass_kg?: number
  bp_systolic?: number
  bp_diastolic?: number
  heart_rate?: number
  bmi?: number
  waist_hip_ratio?: number
}

export type LabResult = {
  id: string
  consultation_id: string
  parameter_id?: number
  custom_parameter?: string
  custom_unit?: string
  custom_ref_min?: number
  custom_ref_max?: number
  value_numeric?: number
  value_text?: string
  classification: 'LOW' | 'NORMAL' | 'HIGH' | 'QUALITATIVE' | 'UNCLASSIFIED'
  result_date?: string
  notes?: string
}

export type PeptideTreatment = {
  id: string
  consultation_id: string
  peptide_name: string
  is_custom: boolean
  dose_value?: number
  dose_unit?: 'mcg' | 'mg' | 'IU' | 'ml'
  frequency?: string
  administration_route?: string
  cycle_start?: string
  cycle_end?: string
  is_active: boolean
}

export type ProgressPhoto = {
  id: string
  consultation_id: string
  patient_id: string
  angle: 'front' | 'side' | 'back'
  storage_path: string
  photo_date: string
}

// ─── HELPERS ────────────────────────────────────────────────

export function getPhotoUrl(path: string): string {
  const { data } = supabase.storage.from('progress-photos').getPublicUrl(path)
  return data.publicUrl
}

// Clasificación automática de valores de laboratorio
export function classifyLabValue(
  value: number,
  refMin?: number,
  refMax?: number
): 'LOW' | 'NORMAL' | 'HIGH' | 'UNCLASSIFIED' {
  if (refMin === undefined || refMax === undefined) return 'UNCLASSIFIED'
  if (value < refMin) return 'LOW'
  if (value > refMax) return 'HIGH'
  return 'NORMAL'
}

// Clasificación del ICC (Índice Cintura-Cadera)
export function classifyWHR(
  ratio: number,
  gender: 'M' | 'F' | 'Other'
): { label: string; color: string; risk: string } {
  if (gender === 'M') {
    if (ratio < 0.90) return { label: 'Bajo Riesgo', color: '#00E5A0', risk: 'low' }
    if (ratio < 0.95) return { label: 'Riesgo Moderado', color: '#FFB547', risk: 'moderate' }
    return { label: 'Alto Riesgo', color: '#FF5C6B', risk: 'high' }
  } else {
    if (ratio < 0.80) return { label: 'Bajo Riesgo', color: '#00E5A0', risk: 'low' }
    if (ratio < 0.85) return { label: 'Riesgo Moderado', color: '#FFB547', risk: 'moderate' }
    return { label: 'Alto Riesgo', color: '#FF5C6B', risk: 'high' }
  }
}

// Constitución ósea por relación Altura/Muñeca
export function classifyFrameSize(
  heightCm: number,
  wristCm: number,
  gender: 'M' | 'F' | 'Other'
): string {
  const ratio = heightCm / wristCm
  if (gender === 'M') {
    if (ratio > 10.4) return 'Complexión Pequeña'
    if (ratio >= 9.6) return 'Complexión Mediana'
    return 'Complexión Grande'
  } else {
    if (ratio > 11.0) return 'Complexión Pequeña'
    if (ratio >= 10.1) return 'Complexión Mediana'
    return 'Complexión Grande'
  }
}
