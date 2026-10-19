import { createFileRoute } from '@tanstack/react-router'
import { ScoutApp } from '../components/shell'
import { AuthView } from '../components/auth'
import { useAuth } from '../lib/authStore'
<link rel="icon" href="data:," />
// --- KAPI GÜVENLİĞİ (AUTH GUARD) ---
function ProtectedRoute() {
  // 1. İçeride aktif bir kullanıcı var mı diye bakıyoruz
  const currentUser = useAuth((s) => s.currentUser)

  // 2. Eğer kullanıcı yoksa, KESİNLİKLE giriş/kayıt ekranını gösteriyoruz
  if (!currentUser) {
    return <AuthView />
  }

  // 3. Eğer kullanıcı giriş yapmışsa ana uygulamaya alıyoruz
  return <ScoutApp />
}

export const Route = createFileRoute('/')({
  component: ProtectedRoute,
})