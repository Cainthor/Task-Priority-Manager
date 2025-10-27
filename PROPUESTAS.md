# Propuestas para Task Priority Manager

## 📚 Librerías Útiles Recomendadas

### Frontend

#### 1. **@tanstack/react-query** (React Query v5)
- **Propósito**: Gestión de estado del servidor, caché y sincronización de datos
- **Beneficios**:
  - Manejo automático de caché de peticiones API
  - Revalidación automática en segundo plano
  - Reduce código repetitivo de fetch/loading/error
  - Mejora la experiencia del usuario con datos instantáneos del caché
- **Instalación**: `npm install @tanstack/react-query`
- **Uso**: Reemplazar useEffect + axios por useQuery/useMutation

#### 2. **react-hot-toast**
- **Propósito**: Notificaciones toast mejoradas
- **Beneficios**:
  - Más ligero y personalizable que el toast actual
  - Animaciones suaves
  - Soporte para promesas (loading → success/error)
  - Mejor integración con dark mode
- **Instalación**: `npm install react-hot-toast`

#### 3. **@dnd-kit** (Drag and Drop)
- **Propósito**: Arrastrar y soltar para reorganizar tickets
- **Beneficios**:
  - Reordenar tickets por prioridad visualmente
  - Mover tickets entre estados (Kanban board)
  - Reasignar tickets entre usuarios
  - Accesible y compatible con mobile
- **Instalación**: `npm install @dnd-kit/core @dnd-kit/sortable`

#### 4. **recharts**
- **Propósito**: Gráficos y visualizaciones
- **Beneficios**:
  - Gráficos de barras: horas por usuario/semana/mes
  - Gráficos de torta: distribución de tickets por prioridad/estado
  - Timeline de workload
  - Burndown charts para seguimiento de progreso
- **Instalación**: `npm install recharts`

#### 5. **date-fns-tz**
- **Propósito**: Manejo de zonas horarias
- **Beneficios**:
  - Soporte completo de timezones
  - Útil si trabajan equipos en diferentes ubicaciones
  - Complementa date-fns que ya tienen instalado
- **Instalación**: `npm install date-fns-tz`

#### 6. **react-day-picker**
- **Propósito**: Selector de fechas mejorado
- **Beneficios**:
  - Más moderno que el input type="date" nativo
  - Selección de rangos de fechas
  - Deshabilitar días específicos (fines de semana, feriados)
  - Mejor UX para asignar fechas de inicio
- **Instalación**: `npm install react-day-picker`

#### 7. **zod**
- **Propósito**: Validación de esquemas
- **Beneficios**:
  - Type-safe validation
  - Integración perfecta con React Hook Form
  - Validaciones más robustas
  - Mejor mensajes de error
- **Instalación**: `npm install zod @hookform/resolvers`

#### 8. **framer-motion**
- **Propósito**: Animaciones
- **Beneficios**:
  - Transiciones suaves entre páginas
  - Animaciones de entrada/salida para modales
  - Feedback visual en interacciones
  - Mejora la percepción de calidad de la app
- **Instalación**: `npm install framer-motion`

### Backend (Laravel)

#### 1. **Laravel Horizon**
- **Propósito**: Gestión de colas y jobs
- **Beneficios**:
  - Dashboard para monitorear jobs
  - Procesar actualizaciones de tickets en background
  - Enviar notificaciones sin bloquear requests
  - Útil para el programa de actualización automática de estados
- **Instalación**: `composer require laravel/horizon`

#### 2. **Laravel Telescope**
- **Propósito**: Debugging y monitoreo
- **Beneficios**:
  - Ver todas las requests HTTP
  - Monitorear queries SQL lentas
  - Debugging de jobs, cache, mails
  - Esencial para desarrollo
- **Instalación**: `composer require laravel/telescope --dev`

#### 3. **spatie/laravel-permission**
- **Propósito**: Sistema de roles y permisos
- **Beneficios**:
  - Roles: Admin, Manager, Developer, etc.
  - Permisos granulares (crear/editar/eliminar tickets)
  - Restricciones por usuario
  - Control de acceso a reportes
- **Instalación**: `composer require spatie/laravel-permission`

#### 4. **spatie/laravel-activitylog**
- **Propósito**: Auditoría y logs de actividad
- **Beneficios**:
  - Registrar quién creó/modificó/eliminó tickets
  - Historial de cambios de prioridad
  - Reasignaciones de tickets
  - Cumplimiento y auditoría
- **Instalación**: `composer require spatie/laravel-activitylog`

#### 5. **Laravel Notifications**
- **Propósito**: Sistema de notificaciones (ya viene con Laravel)
- **Beneficios**:
  - Notificar a usuarios cuando se les asigna un ticket
  - Alertas de deadlines próximos
  - Cambios de prioridad que afectan schedule
  - Canales: database, mail, Slack, etc.
- **Uso**: Ya incluido en Laravel, solo configurar

#### 6. **barryvdh/laravel-dompdf**
- **Propósito**: Generación de PDFs
- **Beneficios**:
  - Exportar reportes a PDF
  - Generar resúmenes mensuales
  - Documentación de asignaciones
- **Instalación**: `composer require barryvdh/laravel-dompdf`

#### 7. **maatwebsite/excel**
- **Propósito**: Importar/Exportar Excel desde backend
- **Beneficios**:
  - Importación masiva de tickets
  - Exportar con formato más complejo
  - Alternativa al export frontend
- **Instalación**: `composer require maatwebsite/excel`

---

## 💡 Ideas y Características para el Proyecto

### 1. **Dashboard Mejorado con Métricas**
- **Widgets**:
  - Tickets completados hoy/esta semana/este mes
  - Horas trabajadas vs planificadas
  - Gráfico de burndown por usuario
  - Top 5 tickets por horas asignadas
  - Workload por día (gráfico de barras)
  - Distribución de tickets por estado (donut chart)

### 2. **Vista Kanban Board**
- Columnas: Pendiente | En Progreso | Completado | Cancelado
- Drag & drop para cambiar estados
- Filtros por usuario, prioridad, fecha
- Contador de horas por columna
- Quick actions: editar, eliminar, ver detalle

### 3. **Timeline/Gantt Chart**
- Visualizar todos los tickets en una línea de tiempo
- Ver dependencias entre tickets
- Identificar conflictos de recursos
- Zoom por día/semana/mes
- Arrastrar para ajustar fechas

### 4. **Sistema de Notificaciones**
- **Tipos de notificaciones**:
  - Nuevo ticket asignado
  - Cambio de prioridad que mueve tus asignaciones
  - Ticket próximo a vencer (alertas 3 días antes, 1 día antes)
  - Ticket completado por ti
  - Comentarios en tickets (nueva feature)
- **Canales**:
  - In-app (badge en navbar)
  - Email (configurable por usuario)
  - Slack/Discord webhook (opcional)

### 5. **Comentarios y Colaboración**
- Agregar comentarios a tickets
- Mencionar usuarios con @
- Adjuntar archivos
- Historial de actividad del ticket
- @menciones envían notificaciones

### 6. **Estimación vs Real**
- Registrar horas reales trabajadas
- Comparar estimado (total_hours) vs real
- Alertas si se excede el estimado
- Reportes de accuracy de estimaciones
- Aprender a estimar mejor con datos históricos

### 7. **Plantillas de Tickets**
- Crear templates para tickets recurrentes
- Pre-configurar: título, descripción, horas, prioridad
- Ejemplo: "Sprint Planning", "Code Review", "Daily Standup"
- Crear múltiples tickets desde template

### 8. **Importación Masiva**
- Subir archivo Excel/CSV con tickets
- Mapear columnas
- Validación antes de importar
- Preview de cambios
- Crear múltiples tickets de una vez

### 9. **Calendario Compartido (iCal/Google Calendar)**
- Exportar asignaciones a formato .ics
- Sincronizar con Google Calendar
- Integración bidireccional (opcional)
- Ver asignaciones en calendario personal

### 10. **Gestión de Capacidad**
- Configurar horas disponibles por usuario
- Ver % de capacidad utilizada
- Alertas de sobreasignación
- Balance automático de carga
- Proponer reasignaciones

### 11. **Dependencias entre Tickets**
- Marcar ticket A depende de ticket B
- No se puede iniciar A hasta completar B
- Visualizar en timeline
- Auto-ajustar fechas cuando cambian dependencias

### 12. **Etiquetas/Tags**
- Agregar tags a tickets (ej: frontend, backend, bug, feature)
- Filtrar por tags
- Colores personalizados
- Búsqueda por tags
- Reportes agrupados por tags

### 13. **Sprints/Milestones**
- Agrupar tickets en sprints
- Fechas de inicio/fin de sprint
- Burndown chart por sprint
- Velocity tracking
- Sprint retrospective reports

### 14. **API Pública**
- Documentación con Swagger/OpenAPI
- Autenticación con API tokens
- Webhooks para eventos
- Integración con herramientas externas
- Rate limiting

### 15. **Mobile App (PWA)**
- Convertir frontend en Progressive Web App
- Instalable en móviles
- Notificaciones push
- Modo offline básico
- Responsive completamente optimizado

### 16. **Configuración Avanzada**
- Horarios de trabajo personalizados por usuario
- Días no laborables por usuario
- Zonas horarias
- Idioma (i18n)
- Temas personalizados

### 17. **Integración con Git**
- Conectar tickets con commits
- Usar "Fixes #123" en commits
- Ver commits relacionados en ticket
- Auto-completar tickets cuando se mergea PR
- GitHub/GitLab integration

### 18. **Búsqueda Avanzada**
- Búsqueda full-text en título y descripción
- Filtros combinados
- Guardar búsquedas frecuentes
- Exportar resultados de búsqueda
- Búsqueda por fechas, rangos, etc.

### 19. **Reportes Adicionales**
- **Reporte de Productividad**: horas completadas vs planificadas
- **Reporte de Workload**: carga de trabajo por semana
- **Reporte de Prioridades**: tiempo en completar por prioridad
- **Reporte de Retrasos**: tickets que excedieron fecha de término
- **Reporte Comparativo**: comparar usuarios/períodos

### 20. **Automatizaciones**
- Auto-asignar tickets según reglas
- Cambiar estado automáticamente
- Recordatorios automáticos
- Escalación de tickets vencidos
- Reasignación automática si usuario ausente

---

## 🤖 Programa Backend para Actualización Automática de Estados

### Descripción
Un proceso que se ejecuta periódicamente para actualizar automáticamente el estado de los tickets basándose en reglas y condiciones.

### Implementación

#### Opción 1: Laravel Scheduled Task (Recomendado)
```php
// app/Console/Commands/UpdateTicketStatus.php
<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Console\Command;

class UpdateTicketStatus extends Command
{
    protected $signature = 'tickets:update-status';
    protected $description = 'Update ticket statuses automatically based on rules';

    public function handle()
    {
        $this->info('Updating ticket statuses...');

        $updated = 0;

        // Rule 1: Mark as in_progress if start_date is today or past and status is pending
        $startedTickets = Ticket::where('status', 'pending')
            ->where('start_date', '<=', Carbon::today())
            ->whereNotNull('start_date')
            ->get();

        foreach ($startedTickets as $ticket) {
            $ticket->update(['status' => 'in_progress']);
            $updated++;
            $this->line("✓ Ticket #{$ticket->id} marked as in_progress");
        }

        // Rule 2: Send notification if deadline is close (3 days before)
        $upcomingDeadlines = Ticket::where('status', 'in_progress')
            ->where('calculated_end_date', '=', Carbon::today()->addDays(3))
            ->whereNotNull('calculated_end_date')
            ->get();

        foreach ($upcomingDeadlines as $ticket) {
            // Send notification to assigned users
            $ticket->assignments->pluck('user')->unique()->each(function ($user) use ($ticket) {
                $user->notify(new \App\Notifications\DeadlineApproaching($ticket));
            });
            $this->line("✉ Notification sent for ticket #{$ticket->id}");
        }

        // Rule 3: Auto-complete if all assignments are done and past end_date
        $completableTickets = Ticket::where('status', 'in_progress')
            ->where('calculated_end_date', '<', Carbon::today())
            ->whereNotNull('calculated_end_date')
            ->get();

        foreach ($completableTickets as $ticket) {
            // Check if all assignments are in the past
            $lastAssignment = $ticket->assignments()->orderBy('date', 'desc')->first();
            if ($lastAssignment && Carbon::parse($lastAssignment->date)->isPast()) {
                $ticket->update(['status' => 'completed']);
                $updated++;
                $this->line("✓ Ticket #{$ticket->id} auto-completed");
            }
        }

        // Rule 4: Alert overdue tickets
        $overdueTickets = Ticket::where('status', 'in_progress')
            ->where('calculated_end_date', '<', Carbon::today()->subDays(1))
            ->whereNotNull('calculated_end_date')
            ->get();

        foreach ($overdueTickets as $ticket) {
            // Send escalation notification
            $ticket->assignments->pluck('user')->unique()->each(function ($user) use ($ticket) {
                $user->notify(new \App\Notifications\TicketOverdue($ticket));
            });
            $this->line("⚠ Overdue notification sent for ticket #{$ticket->id}");
        }

        $this->info("Finished! {$updated} tickets updated.");
        return 0;
    }
}
```

**Registrar en `app/Console/Kernel.php`**:
```php
protected function schedule(Schedule $schedule)
{
    // Run every day at midnight
    $schedule->command('tickets:update-status')
        ->daily()
        ->at('00:00');

    // Or run every hour
    // $schedule->command('tickets:update-status')->hourly();

    // Or run every 30 minutes
    // $schedule->command('tickets:update-status')->everyThirtyMinutes();
}
```

**Configurar cron (Linux/Mac)**:
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

**Windows Task Scheduler**:
```bash
schtasks /create /sc minute /mo 1 /tn "Laravel Scheduler" /tr "C:\MAMP\htdocs\Task-Priority-Manager\artisan schedule:run"
```

#### Opción 2: Laravel Queue Job
```php
// app/Jobs/ProcessTicketStatusUpdate.php
<?php

namespace App\Jobs;

use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessTicketStatusUpdate implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        // Same logic as Command above
    }
}
```

**Despachar job cada hora**:
```php
// In Kernel.php
$schedule->job(new ProcessTicketStatusUpdate)->hourly();
```

### Funcionalidades del Programa

1. **Actualización de Estados**:
   - `pending` → `in_progress` cuando llega start_date
   - `in_progress` → `completed` cuando pasa end_date y todas las asignaciones están completas
   - Marcar como `overdue` si pasa la fecha y sigue en progreso

2. **Notificaciones Automáticas**:
   - 3 días antes del deadline
   - 1 día antes del deadline
   - El día del deadline
   - Tickets vencidos (1 día después, 3 días después, 1 semana después)

3. **Limpieza y Mantenimiento**:
   - Eliminar asignaciones antiguas (> 1 año)
   - Archivar tickets completados antiguos
   - Limpiar logs de actividad

4. **Reportes Automáticos**:
   - Enviar reporte semanal por email a managers
   - Reporte mensual de productividad
   - Alertas de usuarios sobreasignados

5. **Sincronización con Sistemas Externos**:
   - Sincronizar con Jira/Trello si es necesario
   - Actualizar desde API externa
   - Backup automático de la base de datos

### Monitoreo

- Usar Laravel Horizon para ver jobs en tiempo real
- Logs en `storage/logs/laravel.log`
- Failed jobs table para jobs que fallaron
- Notificar a admins si un job falla repetidamente

---

## 🎯 Priorización de Implementación (Recomendada)

### Fase 1 (Inmediato - Alta Prioridad)
1. ✅ Menú vertical con submenús (Ya implementado)
2. ✅ Reportes con Excel export (Ya implementado)
3. Laravel Scheduled Task para actualización de estados
4. Sistema de notificaciones básico
5. Dashboard con métricas

### Fase 2 (Corto Plazo - 1-2 semanas)
1. Vista Kanban Board
2. Roles y permisos (spatie/laravel-permission)
3. Activity log (auditoría)
4. Búsqueda avanzada
5. Gráficos con recharts

### Fase 3 (Mediano Plazo - 1 mes)
1. Timeline/Gantt chart
2. Comentarios en tickets
3. Estimación vs Real
4. Plantillas de tickets
5. Gestión de capacidad

### Fase 4 (Largo Plazo - 2-3 meses)
1. Dependencias entre tickets
2. Sprints/Milestones
3. API pública
4. Mobile PWA
5. Integraciones externas (Git, Slack, etc.)

---

## 📝 Notas Adicionales

- **Testing**: Considerar agregar tests con PHPUnit (backend) y Vitest (frontend)
- **CI/CD**: Configurar GitHub Actions para deploy automático
- **Docker**: Containerizar la aplicación para deployment más fácil
- **Backup**: Implementar backup automático diario de la base de datos
- **Seguridad**: Agregar rate limiting, CSRF protection, SQL injection prevention
- **Performance**: Implementar Redis cache para queries frecuentes
- **Documentación**: Mantener README.md actualizado con instrucciones de setup

---

**Generado el**: 2025-10-26
**Proyecto**: Task Priority Manager
**Versión**: 1.0
