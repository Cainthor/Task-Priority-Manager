# Resumen de Cambios - Task Priority Manager

**Fecha**: 2025-10-27
**Sesión**: Correcciones y mejoras

---

## ✅ COMPLETADO

### Backend (TicketController.php)

1. **✅ Fecha de inicio guardada correctamente** (línea 82)
   - Ahora guarda `start_date` del formulario en el ticket

2. **✅ Máximo de horas cambiado de 9 a 8** (líneas 235, 286, 354)
   - `maxDailyHours = 8` en todas las funciones
   - Horario: 9am - 5pm (8 horas)

3. **✅ Lógica de prioridad muy alta (1) mejorada** (líneas 297-307)
   - Prioridad 1 mueve TODAS las asignaciones del día
   - Prioridad 1 puede tomar las 8 horas completas
   - Otros tickets solo mueven los de menor prioridad

4. **✅ CORS configurado** (config/cors.php línea 8)
   - Permite puertos 5173, 5174, 5175

### Frontend

1. **✅ Dark mode arreglado** (index.css, tailwind.config.js)
   - Variables CSS completas para dark mode
   - Campo descripción funciona en dark mode

2. **✅ Menú vertical con submenús** (Dashboard.jsx)
   - Sidebar colapsable
   - Submenú de Reportes funcionando

3. **✅ Calendario trae 3 meses** (Calendar.jsx línea 75-76)
   - Mes anterior, actual y siguiente

4. **✅ Reportes con Excel export**
   - ReportAssignments.jsx con export
   - ReportSummary.jsx con DataTable, filtros, paginación y export

5. **✅ Columna "Asignado a" en tabla tickets** (Tickets.jsx línea 405, 438)
   - Muestra el consultor asignado

6. **✅ Documento PROPUESTAS.md**
   - 20+ librerías recomendadas
   - 20 ideas de características
   - Plan para programa de actualización automática

---

## ⚠️ PENDIENTE (PRIORITARIO)

### 1. **Corregir función de editar ticket (NO FUNCIONA)**

**Problema**: Al hacer click en "Actualizar" no funciona.

**Causa probable**: El update en backend no recalcula assignments si cambias otros campos.

**Solución**:
```javascript
// En Tickets.jsx, línea 75-81
// Necesita enviar también user_id si queremos permitir reasignación
```

**Backend necesita** endpoint nuevo para reasignar:
```php
// TicketController.php
public function reassign(Request $request, $id)
{
    $ticket = Ticket::find($id);
    // Eliminar assignments actuales
    $ticket->assignments()->delete();
    // Reasignar con nuevo usuario
    $this->assignTicketToUser($ticket, $request->new_user_id, $ticket->start_date);
}
```

### 2. **Permitir cambiar consultor en editar**

**Ubicación**: Tickets.jsx línea 279-299 (form de editar)

**Agregar**:
```jsx
{editingTicket && (
    <div className="space-y-2">
        <Label htmlFor="new_user_id">Reasignar a</Label>
        <input type="hidden" {...register('new_user_id')} />
        <Select
            onValueChange={(value) => setValue('new_user_id', value)}
            value={watch('new_user_id')}
        >
            <SelectTrigger>
                <SelectValue placeholder="Cambiar consultor (opcional)" />
            </SelectTrigger>
            <SelectContent>
                {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
)}
```

### 3. **Agregar estado "detenido" / "stopped"**

**Backend**: `database/migrations/*_create_tickets_table.php`
```php
// Cambiar enum de status
$table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled', 'stopped'])->default('pending');
```

**Frontend**: `Tickets.jsx` líneas 35-40
```javascript
const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    stopped: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', // NUEVO
};
```

Y líneas 194-202:
```javascript
const getStatusLabel = (status) => {
    const labels = {
        pending: 'Pendiente',
        in_progress: 'En Progreso',
        completed: 'Completado',
        cancelled: 'Cancelado',
        stopped: 'Detenido', // NUEVO
    };
    return labels[status] || status;
};
```

Agregar en el Select de status (línea 291-296):
```jsx
<SelectItem value="stopped">Detenido</SelectItem>
```

### 4. **Notificaciones por email al asignar ticket**

**Instalar Laravel Mail**:
```bash
cd C:\MAMP\htdocs\Task-Priority-Manager
php artisan make:notification TicketAssigned
```

**En app/Notifications/TicketAssigned.php**:
```php
<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Ticket;

class TicketAssigned extends Notification
{
    use Queueable;

    protected $ticket;

    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Nuevo Ticket Asignado')
            ->greeting('Hola ' . $notifiable->name)
            ->line('Se te ha asignado un nuevo ticket:')
            ->line('Título: ' . $this->ticket->title)
            ->line('Prioridad: ' . $this->getPriorityLabel($this->ticket->priority))
            ->line('Horas estimadas: ' . $this->ticket->total_hours . 'h')
            ->line('Fecha de inicio: ' . $this->ticket->start_date)
            ->action('Ver Ticket', url('/dashboard/tickets'))
            ->line('Gracias por tu colaboración!');
    }

    private function getPriorityLabel($priority)
    {
        $labels = [1 => 'Muy Alta', 2 => 'Alta', 3 => 'Media', 4 => 'Baja', 5 => 'Muy Baja'];
        return $labels[$priority] ?? 'Desconocida';
    }
}
```

**En TicketController.php línea 86** (después de assignTicketToUser):
```php
// Enviar notificación al usuario asignado
$user = User::find($request->user_id);
$user->notify(new \App\Notifications\TicketAssigned($ticket));
```

**Configurar email en .env**:
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu@email.com
MAIL_PASSWORD=tu_contraseña
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@taskmanager.com
MAIL_FROM_NAME="Task Priority Manager"
```

### 5. **Advertencia cuando día está completo**

**Backend**: Crear endpoint para verificar disponibilidad

`routes/api.php`:
```php
Route::post('/check-availability', [TicketController::class, 'checkAvailability']);
```

`TicketController.php`:
```php
public function checkAvailability(Request $request)
{
    $userId = $request->user_id;
    $startDate = Carbon::parse($request->start_date);
    $totalHours = $request->total_hours;
    $hoursPerDay = 4;

    $daysNeeded = ceil($totalHours / $hoursPerDay);
    $fullDays = [];

    for ($i = 0; $i < $daysNeeded; $i++) {
        $date = $startDate->copy()->addDays($i);

        // Skip weekends
        if ($date->isWeekend()) continue;

        $assignedHours = TicketAssignment::where('user_id', $userId)
            ->where('date', $date->format('Y-m-d'))
            ->sum('hours');

        if ($assignedHours >= 8) {
            $fullDays[] = $date->format('Y-m-d');
        }
    }

    return response()->json([
        'has_full_days' => count($fullDays) > 0,
        'full_days' => $fullDays,
        'message' => count($fullDays) > 0
            ? 'ADVERTENCIA: El usuario tiene ' . count($fullDays) . ' día(s) completos en el rango. Las asignaciones existentes serán movidas según prioridad.'
            : 'El usuario tiene disponibilidad en el rango seleccionado.'
    ]);
}
```

**Frontend**: En Tickets.jsx, antes de submit:
```javascript
const checkAvailability = async (data) => {
    try {
        const response = await axios.post('/api/check-availability', {
            user_id: parseInt(data.user_id),
            start_date: data.start_date,
            total_hours: parseFloat(data.total_hours),
        });

        if (response.data.has_full_days) {
            toast({
                title: 'Advertencia',
                description: response.data.message,
                variant: 'warning', // Necesitas agregar esta variant
            });
            // Opcional: mostrar dialog de confirmación
        }

        return true;
    } catch (error) {
        console.error('Error checking availability:', error);
        return true; // Continue anyway
    }
};

// En onSubmit, antes de crear el ticket:
await checkAvailability(data);
```

---

## 📋 PENDIENTE (UI/UX)

### 6. **Corregir posición botón dark mode**

El botón está bien posicionado en el sidebar (Dashboard.jsx línea 160), pero si quieres moverlo al header superior:

```jsx
// En Dashboard.jsx línea 172-177
<header className="h-16 bg-card border-b border-border flex items-center px-6 justify-between">
    <h1 className="text-xl font-semibold text-foreground">
        {/* ... */}
    </h1>
    <ThemeToggle /> {/* Mover aquí */}
</header>
```

### 7. **Hacer proyecto responsivo**

**Dashboard.jsx** - Agregar menu mobile:
```jsx
// Estado para mobile menu
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// Agregar botón hamburguesa en mobile
<div className="lg:hidden">
    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <Menu className="h-6 w-6" />
    </button>
</div>

// Sidebar responsive
<aside className={`
    w-64 bg-card border-r border-border flex flex-col
    fixed lg:static inset-y-0 left-0 z-50
    transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 transition-transform duration-300
`}>
```

**Tickets.jsx, Calendar.jsx, Reports** - Agregar:
```jsx
<div className="overflow-x-auto"> {/* Wrapper para tablas */}
    <Table className="min-w-[600px]"> {/* Ancho mínimo */}
        {/* ... */}
    </Table>
</div>
```

### 8. **Implementar vista de tickets estilo shadcn/ui**

Referencia: https://ui.shadcn.com/examples/tasks

**Características**:
- Vista de lista con filtros laterales
- Tags/etiquetas por color
- Vista de columnas (Kanban-style)
- Drag & drop entre estados
- Búsqueda avanzada

**Instalar componentes necesarios**:
```bash
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
```

### 9. **Implementar dashboard estilo shadcn/ui**

Referencia: https://ui.shadcn.com/examples/dashboard

**Características**:
- Cards con métricas principales
- Gráficos (usar recharts)
- Timeline de actividad reciente
- Overview de tickets por estado

---

## 🚀 PARA SIGUIENTE SESIÓN

### Prioridad Alta
1. Arreglar función de editar ticket
2. Agregar estado "detenido"
3. Implementar notificaciones por email
4. Agregar advertencia de disponibilidad

### Prioridad Media
5. Permitir cambiar consultor en editar
6. Hacer proyecto completamente responsivo
7. Corregir posición dark mode (si es necesario)

### Prioridad Baja (Mejoras UX)
8. Implementar vista de tickets estilo shadcn
9. Implementar dashboard estilo shadcn
10. Agregar gráficos y estadísticas

---

## 📝 COMANDOS ÚTILES

```bash
# Frontend
cd C:\MAMP\htdocs\Task-Priority-Manager\frontend
npm run dev

# Backend
cd C:\MAMP\htdocs\Task-Priority-Manager
php artisan serve

# Limpiar cache Laravel
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Crear migración
php artisan make:migration add_stopped_status_to_tickets_table

# Correr migración
php artisan migrate

# Crear notificación
php artisan make:notification TicketAssigned
```

---

## 🐛 BUGS CONOCIDOS

1. **Editar ticket no funciona** - onSubmit no recalcula assignments
2. Faltan validaciones en frontend para campos required
3. Toast de advertencia necesita variant='warning' custom

---

## ✨ FEATURES ADICIONALES SUGERIDAS

Ver archivo `PROPUESTAS.md` para lista completa de:
- 20+ librerías recomendadas
- 20 ideas de características
- Plan de implementación backend automático
- Roadmap en 4 fases

---

**Última actualización**: 2025-10-27 00:30
