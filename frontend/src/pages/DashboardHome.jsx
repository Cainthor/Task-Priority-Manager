import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bienvenido</h2>
        <p className="text-muted-foreground">Selecciona una opción para comenzar</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/dashboard/users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>
                Crear, editar y eliminar usuarios del sistema
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/dashboard/tasks">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
                Gestión de Tareas
              </CardTitle>
              <CardDescription>
                Administrar y priorizar tareas
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}