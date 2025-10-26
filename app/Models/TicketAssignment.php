<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketAssignment extends Model
{
    protected $fillable = [
        'ticket_id',
        'user_id',
        'date',
        'start_time',
        'end_time',
        'hours',
    ];

    protected $casts = [
        'date' => 'date',
        'hours' => 'decimal:2',
    ];

    /**
     * Get the ticket for this assignment
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Get the user assigned to this ticket
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
