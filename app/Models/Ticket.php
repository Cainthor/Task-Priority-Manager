<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = [
        'title',
        'description',
        'priority',
        'total_hours',
        'hours_per_day',
        'status',
        'created_by',
        'technical_user_id',
        'functional_user_id',
        'start_date',
        'calculated_end_date',
        'buffer_days',
    ];

    protected $casts = [
        'total_hours' => 'decimal:2',
        'hours_per_day' => 'decimal:2',
        'priority' => 'integer',
        'start_date' => 'date',
        'calculated_end_date' => 'date',
        'buffer_days' => 'integer',
    ];

    /**
     * Get the user who created the ticket
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all assignments for this ticket
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(TicketAssignment::class);
    }

    /**
     * Get the technical user assigned to this ticket
     */
    public function technicalUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technical_user_id');
    }

    /**
     * Get the functional user assigned to this ticket
     */
    public function functionalUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'functional_user_id');
    }
}
