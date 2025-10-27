<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    protected $fillable = [
        'name',
        'type',
    ];

    /**
     * Get the users that have this specialty
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
