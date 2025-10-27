<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Ticket;

class TicketAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    protected $ticket;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Nuevo Ticket Asignado - Task Priority Manager')
            ->greeting('Hola ' . $notifiable->name . '!')
            ->line('Se te ha asignado un nuevo ticket:')
            ->line('')
            ->line('**Título:** ' . $this->ticket->title)
            ->line('**Descripción:** ' . ($this->ticket->description ?: 'Sin descripción'))
            ->line('**Prioridad:** ' . $this->getPriorityLabel($this->ticket->priority))
            ->line('**Horas estimadas:** ' . $this->ticket->total_hours . 'h')
            ->line('**Fecha de inicio:** ' . $this->ticket->start_date)
            ->line('**Fecha de término estimada:** ' . ($this->ticket->calculated_end_date ?: 'Por calcular'))
            ->action('Ver Ticket', url('/dashboard/tickets'))
            ->line('¡Gracias por tu colaboración!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'ticket_title' => $this->ticket->title,
            'priority' => $this->ticket->priority,
            'total_hours' => $this->ticket->total_hours,
            'start_date' => $this->ticket->start_date,
        ];
    }

    /**
     * Get priority label in Spanish
     */
    private function getPriorityLabel($priority)
    {
        $labels = [
            1 => 'Muy Alta',
            2 => 'Alta',
            3 => 'Media',
            4 => 'Baja',
            5 => 'Muy Baja'
        ];
        return $labels[$priority] ?? 'Desconocida';
    }
}
