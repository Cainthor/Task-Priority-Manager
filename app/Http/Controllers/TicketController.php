<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketAssignment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    /**
     * Get all tickets
     */
    public function index(Request $request)
    {
        $query = Ticket::with(['creator', 'assignments.user', 'technicalUser', 'functionalUser']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by created_by
        if ($request->has('created_by')) {
            $query->where('created_by', $request->created_by);
        }

        $tickets = $query->orderBy('priority', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    /**
     * Get a specific ticket
     */
    public function show($id)
    {
        $ticket = Ticket::with(['creator', 'assignments.user'])->find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        return response()->json($ticket);
    }

    /**
     * Create a new ticket and assign it to a user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|integer|min:1|max:5',
            'total_hours' => 'required|numeric|min:0.5',
            'user_id' => 'required|exists:users,id',
            'technical_user_id' => 'nullable|exists:users,id',
            'functional_user_id' => 'nullable|exists:users,id',
            'start_date' => 'required|date|after_or_equal:today',
            'buffer_days' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            // Create the ticket
            $ticket = Ticket::create([
                'title' => $request->title,
                'description' => $request->description,
                'priority' => $request->priority,
                'total_hours' => $request->total_hours,
                'hours_per_day' => 4, // Always 4 hours per day
                'status' => 'pending',
                'created_by' => $request->user()->id,
                'technical_user_id' => $request->technical_user_id,
                'functional_user_id' => $request->functional_user_id,
                'start_date' => $request->start_date, // Save the start date from form
                'buffer_days' => $request->buffer_days ?? 0,
            ]);

            // Assign the ticket to the user with priority logic, starting from the specified date
            $this->assignTicketToUser($ticket, $request->user_id, $request->start_date);

            // If priority is very high (1), reorganize calendar to optimize space
            // This ensures other tickets fill the remaining space
            if ($request->priority == 1) {
                $this->reorganizeUserCalendar($request->user_id);
            }

            // Send notification to the assigned user
            $user = \App\Models\User::find($request->user_id);
            if ($user) {
                $user->notify(new \App\Notifications\TicketAssigned($ticket));
            }

            DB::commit();

            return response()->json([
                'message' => 'Ticket created successfully',
                'ticket' => $ticket->load(['creator', 'assignments.user'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating ticket: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a ticket
     */
    public function update(Request $request, $id)
    {
        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'sometimes|required|integer|min:1|max:5',
            'status' => 'sometimes|required|in:pending,in_progress,completed,cancelled,stopped',
            'total_hours' => 'nullable|numeric|min:0.5',
            'technical_user_id' => 'nullable|exists:users,id',
            'functional_user_id' => 'nullable|exists:users,id',
            'new_user_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $oldPriority = $ticket->priority;
            $oldTotalHours = $ticket->total_hours;
            $ticket->update($request->only(['title', 'description', 'priority', 'status', 'total_hours', 'technical_user_id', 'functional_user_id']));

            // If user wants to reassign to a new user
            if ($request->has('new_user_id') && $request->new_user_id) {
                $newUserId = $request->new_user_id;
                $originalStartDate = $ticket->start_date; // Preserve original start date

                // Delete current assignments
                $ticket->assignments()->delete();

                // Reassign to new user
                $this->assignTicketToUser($ticket, $newUserId, $originalStartDate);

                // Reorganize calendar for the new user to optimize space
                $this->reorganizeUserCalendar($newUserId);

                // Send notification to new user
                $newUser = \App\Models\User::find($newUserId);
                if ($newUser) {
                    $newUser->notify(new \App\Notifications\TicketAssigned($ticket));
                }
            }
            // If priority or total_hours changed (and not reassigning), recalculate entire user calendar
            elseif (
                ($request->has('priority') && $oldPriority != $request->priority) ||
                ($request->has('total_hours') && $oldTotalHours != $request->total_hours)
            ) {
                // Get all assignments for this ticket
                $assignments = $ticket->assignments;
                if ($assignments->isNotEmpty()) {
                    $userId = $assignments->first()->user_id;
                    // Reorganize entire calendar for this user to optimize space
                    $this->reorganizeUserCalendar($userId);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Ticket updated successfully',
                'ticket' => $ticket->load(['creator', 'assignments.user'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating ticket: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a ticket
     */
    public function destroy($id)
    {
        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found'], 404);
        }

        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted successfully']);
    }

    /**
     * Check user availability for ticket assignment
     */
    public function checkAvailability(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'total_hours' => 'required|numeric|min:0.5',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = $request->user_id;
        $startDate = Carbon::parse($request->start_date);
        $totalHours = $request->total_hours;
        $hoursPerDay = 4;

        $daysNeeded = ceil($totalHours / $hoursPerDay);
        $fullDays = [];
        $warnings = [];

        for ($i = 0; $i < $daysNeeded; $i++) {
            $date = $startDate->copy()->addDays($i);

            // Skip weekends
            while ($date->isWeekend()) {
                $date->addDay();
            }

            // Skip holidays
            while (\App\Models\Holiday::isHoliday($date)) {
                $date->addDay();
            }

            $assignedHours = TicketAssignment::where('user_id', $userId)
                ->where('date', $date->format('Y-m-d'))
                ->sum('hours');

            if ($assignedHours >= 8) {
                $fullDays[] = [
                    'date' => $date->format('Y-m-d'),
                    'assigned_hours' => $assignedHours
                ];
            } elseif ($assignedHours >= 6) {
                $warnings[] = [
                    'date' => $date->format('Y-m-d'),
                    'assigned_hours' => $assignedHours,
                    'available_hours' => 8 - $assignedHours
                ];
            }
        }

        $hasFullDays = count($fullDays) > 0;
        $hasWarnings = count($warnings) > 0;

        $message = '';
        if ($hasFullDays) {
            $message = 'ADVERTENCIA: El usuario tiene ' . count($fullDays) . ' día(s) completos (8h) en el rango de fechas. Las asignaciones existentes serán movidas según su prioridad.';
        } elseif ($hasWarnings) {
            $message = 'NOTA: El usuario tiene ' . count($warnings) . ' día(s) con más de 6 horas asignadas. Disponibilidad limitada.';
        } else {
            $message = 'El usuario tiene buena disponibilidad en el rango seleccionado.';
        }

        return response()->json([
            'has_full_days' => $hasFullDays,
            'has_warnings' => $hasWarnings,
            'full_days' => $fullDays,
            'warnings' => $warnings,
            'message' => $message,
            'severity' => $hasFullDays ? 'error' : ($hasWarnings ? 'warning' : 'success')
        ]);
    }

    /**
     * Get assignments for a specific user and date range
     */
    public function getAssignments(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assignments = TicketAssignment::with(['ticket', 'user'])
            ->where('user_id', $request->user_id)
            ->whereBetween('date', [$request->start_date, $request->end_date])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return response()->json($assignments);
    }

    /**
     * Assign ticket to a user with priority logic
     */
    private function assignTicketToUser(Ticket $ticket, $userId, $startDate = null)
    {
        // Priority 1 (very high) can use full 8 hours per day
        $hoursPerDay = ($ticket->priority == 1) ? 8 : ($ticket->hours_per_day ?? 4);
        $totalHours = $ticket->total_hours;
        $assignedHours = 0;

        // Get the starting date for this user (use provided date or today)
        $currentDate = $startDate ? Carbon::parse($startDate) : Carbon::today();
        $firstAssignmentDate = $currentDate->copy();
        $lastAssignmentDate = null;

        $attempts = 0;
        $maxAttempts = 365; // Prevent infinite loop

        while ($assignedHours < $totalHours && $attempts < $maxAttempts) {
            $attempts++;

            // Skip weekends (Saturday = 6, Sunday = 0)
            if ($currentDate->dayOfWeek === 0 || $currentDate->dayOfWeek === 6) {
                $currentDate->addDay();
                continue;
            }

            // Skip holidays
            if (\App\Models\Holiday::isHoliday($currentDate)) {
                $currentDate->addDay();
                continue;
            }

            // Check if the user already has assignments on this date
            $existingAssignments = TicketAssignment::where('user_id', $userId)
                ->where('date', $currentDate->format('Y-m-d'))
                ->with('ticket')
                ->get();

            // Calculate total hours already assigned
            $totalAssignedHours = $existingAssignments->sum('hours');
            $maxDailyHours = 8; // 9am to 5pm = 8 hours

            // Check if this ticket already has an assignment on this date
            $alreadyAssignedToday = TicketAssignment::where('ticket_id', $ticket->id)
                ->where('user_id', $userId)
                ->where('date', $currentDate->format('Y-m-d'))
                ->exists();

            // For non-priority-1 tickets, skip if already assigned today (max 1 assignment per day)
            if ($ticket->priority != 1 && $alreadyAssignedToday) {
                $currentDate->addDay();
                continue;
            }

            // If the day has space
            if ($totalAssignedHours < $maxDailyHours) {
                // Check if we need to move lower priority tickets
                $availableHours = $this->getAvailableHours($ticket, $existingAssignments, $userId, $currentDate);

                if ($availableHours > 0) {
                    // Calculate hours for this assignment
                    $remainingHours = $totalHours - $assignedHours;
                    $hoursThisDay = min($hoursPerDay, $remainingHours, $availableHours);

                    // For priority 1, we need to refresh assignments since they were all moved
                    if ($ticket->priority == 1) {
                        $existingAssignments = TicketAssignment::where('user_id', $userId)
                            ->where('date', $currentDate->format('Y-m-d'))
                            ->with('ticket')
                            ->get();
                    }

                    // Determine start and end time based on existing assignments
                    // For priority 1, ensure it starts at the beginning of the day
                    if ($ticket->priority == 1) {
                        $timeSlot = [
                            'start' => '09:00:00',
                            'end' => sprintf('%02d:00:00', 9 + $hoursThisDay),
                        ];
                    } else {
                        $timeSlot = $this->findAvailableTimeSlot($existingAssignments, $hoursThisDay);
                    }

                    // Create the assignment
                    TicketAssignment::create([
                        'ticket_id' => $ticket->id,
                        'user_id' => $userId,
                        'date' => $currentDate->format('Y-m-d'),
                        'start_time' => $timeSlot['start'],
                        'end_time' => $timeSlot['end'],
                        'hours' => $hoursThisDay,
                    ]);

                    $assignedHours += $hoursThisDay;
                    $lastAssignmentDate = $currentDate->copy();

                    // For non-priority-1 tickets, move to next day after creating assignment
                    // (only 1 assignment of 4 hours per day allowed)
                    if ($ticket->priority != 1) {
                        $currentDate->addDay();
                        continue;
                    }
                }
            }

            $currentDate->addDay();
        }

        // Update ticket with start and calculated end date
        if ($assignedHours > 0) {
            $bufferDays = $ticket->buffer_days ?? 0;
            $endDateWithBuffer = $lastAssignmentDate->copy()->addDays($bufferDays);

            $ticket->update([
                'status' => 'in_progress',
                'start_date' => $firstAssignmentDate->format('Y-m-d'),
                'calculated_end_date' => $endDateWithBuffer->format('Y-m-d'),
            ]);
        }
    }

    /**
     * Get available hours for a ticket, potentially moving lower priority assignments
     */
    private function getAvailableHours($newTicket, $existingAssignments, $userId, $date)
    {
        $maxDailyHours = 8; // 9am to 5pm

        // If no assignments, return max hours
        if ($existingAssignments->isEmpty()) {
            return $maxDailyHours;
        }

        // Calculate total hours already assigned
        $totalHours = $existingAssignments->sum('hours');
        $availableHours = $maxDailyHours - $totalHours;

        // If there's space without moving anything, return available hours
        if ($availableHours > 0) {
            return $availableHours;
        }

        // Need to move some assignments - find lower priority ones
        $assignmentsToMove = $existingAssignments->filter(function ($assignment) use ($newTicket) {
            // Priority 1 can displace any other ticket
            // Other priorities only displace lower priority tickets
            if ($newTicket->priority == 1) {
                return true; // Can move any ticket
            }
            return $assignment->ticket->priority > $newTicket->priority;
        })->sortByDesc(function ($assignment) {
            return $assignment->ticket->priority;
        });

        // Move lower priority assignments to free up space
        $freedHours = 0;
        foreach ($assignmentsToMove as $assignment) {
            // Move this assignment to the next available day
            $this->moveAssignmentByHours($assignment, $userId, $assignment->hours);
            $freedHours += $assignment->hours;
            $totalHours -= $assignment->hours;

            // Stop if we have freed enough space
            if ($maxDailyHours - $totalHours > 0) {
                break;
            }
        }

        return min($maxDailyHours - $totalHours + $freedHours, $maxDailyHours);
    }

    /**
     * Move an assignment by hours to the next available day
     */
    private function moveAssignmentByHours($assignment, $userId, $hours)
    {
        $currentDate = Carbon::parse($assignment->date)->addDay();
        $moved = false;
        $attempts = 0;
        $maxAttempts = 365;

        // Delete the current assignment
        $ticket = $assignment->ticket;
        $assignment->delete();

        // Find next available slot for these hours
        while (!$moved && $attempts < $maxAttempts) {
            $attempts++;

            // Skip weekends and holidays
            if ($currentDate->dayOfWeek === 0 || $currentDate->dayOfWeek === 6 || \App\Models\Holiday::isHoliday($currentDate)) {
                $currentDate->addDay();
                continue;
            }

            // Check if this ticket already has an assignment on this date
            // For non-priority-1 tickets, only allow 1 assignment per day
            $ticketAlreadyAssignedHere = TicketAssignment::where('ticket_id', $ticket->id)
                ->where('user_id', $userId)
                ->where('date', $currentDate->format('Y-m-d'))
                ->exists();

            // Skip this day if ticket is not priority 1 and already has assignment
            if ($ticket->priority != 1 && $ticketAlreadyAssignedHere) {
                $currentDate->addDay();
                continue;
            }

            $existingAssignments = TicketAssignment::where('user_id', $userId)
                ->where('date', $currentDate->format('Y-m-d'))
                ->get();

            $totalHours = $existingAssignments->sum('hours');
            $maxDailyHours = 8;

            if ($totalHours + $hours <= $maxDailyHours) {
                // Create new assignment for the moved hours
                $timeSlot = $this->findAvailableTimeSlot($existingAssignments, $hours);

                TicketAssignment::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $userId,
                    'date' => $currentDate->format('Y-m-d'),
                    'start_time' => $timeSlot['start'],
                    'end_time' => $timeSlot['end'],
                    'hours' => $hours,
                ]);

                $moved = true;

                // Recalculate ticket end date
                $this->recalculateTicketEndDate($ticket);
            }

            $currentDate->addDay();
        }
    }

    /**
     * Find available time slot in a day
     */
    private function findAvailableTimeSlot($existingAssignments, $hours)
    {
        // Default work hours: 9 AM to 5 PM (8 hours)
        $startHour = 9;
        $endHour = 17;

        if ($existingAssignments->isEmpty()) {
            return [
                'start' => sprintf('%02d:00:00', $startHour),
                'end' => sprintf('%02d:00:00', $startHour + $hours),
            ];
        }

        // Sort assignments by start time
        $sorted = $existingAssignments->sortBy('start_time');

        // Try to fit in the first available slot
        $currentTime = $startHour;

        foreach ($sorted as $assignment) {
            $assignmentStart = Carbon::parse($assignment->start_time)->hour;

            if ($currentTime + $hours <= $assignmentStart) {
                // Found a slot before this assignment
                return [
                    'start' => sprintf('%02d:00:00', $currentTime),
                    'end' => sprintf('%02d:00:00', $currentTime + $hours),
                ];
            }

            $assignmentEnd = Carbon::parse($assignment->end_time)->hour;
            $currentTime = max($currentTime, $assignmentEnd);
        }

        // Check if there's space after all assignments
        if ($currentTime + $hours <= $endHour) {
            return [
                'start' => sprintf('%02d:00:00', $currentTime),
                'end' => sprintf('%02d:00:00', $currentTime + $hours),
            ];
        }

        // Fallback (shouldn't reach here if logic is correct)
        return [
            'start' => sprintf('%02d:00:00', $startHour),
            'end' => sprintf('%02d:00:00', $startHour + $hours),
        ];
    }

    /**
     * Recalculate ticket end date based on current assignments
     */
    private function recalculateTicketEndDate($ticket)
    {
        $assignments = $ticket->assignments()->orderBy('date')->get();

        if ($assignments->isEmpty()) {
            return;
        }

        $firstDate = Carbon::parse($assignments->first()->date);
        $lastDate = Carbon::parse($assignments->last()->date);
        $bufferDays = $ticket->buffer_days ?? 0;
        $endDateWithBuffer = $lastDate->copy()->addDays($bufferDays);

        $ticket->update([
            'start_date' => $firstDate->format('Y-m-d'),
            'calculated_end_date' => $endDateWithBuffer->format('Y-m-d'),
        ]);
    }

    /**
     * Reorganize entire calendar for a user after a ticket modification
     * This ensures that freed up space is utilized by other tickets
     */
    private function reorganizeUserCalendar($userId)
    {
        // Get all tickets with assignments for this user
        $ticketIds = TicketAssignment::where('user_id', $userId)
            ->distinct()
            ->pluck('ticket_id');

        if ($ticketIds->isEmpty()) {
            return;
        }

        // Get all active tickets (pending or in_progress) for this user
        $tickets = Ticket::whereIn('id', $ticketIds)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('priority', 'asc') // Priority 1 first (very high)
            ->orderBy('start_date', 'asc') // Then by original start date
            ->get();

        if ($tickets->isEmpty()) {
            return;
        }

        // Store original start dates for each ticket before deleting assignments
        $originalStartDates = [];
        foreach ($tickets as $ticket) {
            $originalStartDates[$ticket->id] = $ticket->start_date;
        }

        // Delete all assignments for this user
        TicketAssignment::where('user_id', $userId)
            ->whereIn('ticket_id', $ticketIds)
            ->delete();

        // Re-assign all tickets in priority order, respecting original start dates
        foreach ($tickets as $ticket) {
            $ticket->refresh(); // Refresh to get updated total_hours if changed
            $originalStartDate = $originalStartDates[$ticket->id];
            $this->assignTicketToUser($ticket, $userId, $originalStartDate);
        }
    }
}
