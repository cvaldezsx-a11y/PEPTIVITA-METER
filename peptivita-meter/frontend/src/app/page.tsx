import type { Metadata } from 'next'
import RoleSelector from '@/components/auth/RoleSelector'

export const metadata: Metadata = {
  title: 'Peptivita Meter — Seguimiento Clínico',
  description: 'Plataforma de seguimiento antropométrico, metabólico y de péptidos terapéuticos',
}

export default function HomePage() {
  return <RoleSelector />
}
