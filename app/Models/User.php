<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_type',
        'specialty_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get tickets created by this user
     */
    public function createdTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'created_by');
    }

    /**
     * Get ticket assignments for this user
     */
    public function ticketAssignments(): HasMany
    {
        return $this->hasMany(TicketAssignment::class);
    }

    /**
     * Get the specialty for this user
     */
    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }

    /**
     * Get tickets where this user is the technical user
     */
    public function technicalTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'technical_user_id');
    }

    /**
     * Get tickets where this user is the functional user
     */
    public function functionalTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'functional_user_id');
    }
}