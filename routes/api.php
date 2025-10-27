<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SpecialtyController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('users', UserController::class);

    // Specialty routes
    Route::get('/specialties', [SpecialtyController::class, 'index']);

    // Ticket routes
    Route::apiResource('tickets', TicketController::class);
    Route::get('/assignments', [TicketController::class, 'getAssignments']);
    Route::post('/check-availability', [TicketController::class, 'checkAvailability']);

    // Settings routes
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings/{key}', [SettingsController::class, 'update']);

    // Holidays routes
    Route::get('/holidays', [SettingsController::class, 'getHolidays']);
    Route::post('/holidays', [SettingsController::class, 'storeHoliday']);
    Route::delete('/holidays/{id}', [SettingsController::class, 'destroyHoliday']);
    Route::post('/holidays/sync', [SettingsController::class, 'syncHolidays']);
});