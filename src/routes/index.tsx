import { createFileRoute } from '@tanstack/react-router';
import { Shell } from '../components/shell';

export const Route = createFileRoute('/')({
  component: ProtectedRoute,
});

function ProtectedRoute() {
  return <Shell />;
}