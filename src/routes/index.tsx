import { createFileRoute } from '@tanstack/react-router'
import { ScoutApp } from '../components/shell'
import { AuthGate } from '../components/authgate'

export const Route = createFileRoute('/')({
  component: ProtectedRoute,
})

function ProtectedRoute() {
  return (
    <AuthGate>
      <ScoutApp />
    </AuthGate>
  )
}