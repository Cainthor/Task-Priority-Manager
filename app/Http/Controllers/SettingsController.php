<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Artisan;

class SettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function index()
    {
        $settings = Setting::all();
        return response()->json($settings);
    }

    /**
     * Update a setting
     */
    public function update(Request $request, $key)
    {
        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json(['message' => 'Setting not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'value' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $setting->update(['value' => $request->value]);

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => $setting
        ]);
    }

    /**
     * Get all holidays
     */
    public function getHolidays()
    {
        $holidays = Holiday::orderBy('date')->get();
        return response()->json($holidays);
    }

    /**
     * Create a holiday
     */
    public function storeHoliday(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_recurring' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $holiday = Holiday::create($request->all());

        return response()->json([
            'message' => 'Holiday created successfully',
            'holiday' => $holiday
        ], 201);
    }

    /**
     * Delete a holiday
     */
    public function destroyHoliday($id)
    {
        $holiday = Holiday::find($id);

        if (!$holiday) {
            return response()->json(['message' => 'Holiday not found'], 404);
        }

        $holiday->delete();

        return response()->json(['message' => 'Holiday deleted successfully']);
    }

    /**
     * Sync holidays from API
     */
    public function syncHolidays(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'year' => 'required|integer|min:2020|max:2030',
            'country' => 'required|string|size:2',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            Artisan::call('holidays:sync', [
                'year' => $request->year,
                'country' => $request->country,
            ]);

            $output = Artisan::output();

            return response()->json([
                'message' => 'Holidays synced successfully',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error syncing holidays: ' . $e->getMessage()
            ], 500);
        }
    }
}
