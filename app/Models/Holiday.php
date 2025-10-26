<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Holiday extends Model
{
    protected $fillable = [
        'date',
        'name',
        'description',
        'is_recurring',
    ];

    protected $casts = [
        'date' => 'date',
        'is_recurring' => 'boolean',
    ];

    /**
     * Check if a date is a holiday
     */
    public static function isHoliday($date)
    {
        $carbonDate = Carbon::parse($date);

        // Check exact date
        $exactMatch = static::where('date', $carbonDate->format('Y-m-d'))->exists();

        if ($exactMatch) {
            return true;
        }

        // Check recurring holidays (same month and day, any year)
        $recurringMatch = static::where('is_recurring', true)
            ->whereRaw('MONTH(date) = ? AND DAY(date) = ?', [
                $carbonDate->month,
                $carbonDate->day
            ])
            ->exists();

        return $recurringMatch;
    }
}
