<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // setting key (e.g., 'work_start_hour')
            $table->text('value'); // setting value
            $table->string('type')->default('string'); // type: string, integer, time, json
            $table->text('description')->nullable(); // description of the setting
            $table->timestamps();
        });

        // Insert default settings
        DB::table('settings')->insert([
            [
                'key' => 'work_start_hour',
                'value' => '09:00',
                'type' => 'time',
                'description' => 'Hora de inicio de jornada laboral',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'work_end_hour',
                'value' => '18:00',
                'type' => 'time',
                'description' => 'Hora de fin de jornada laboral',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'hours_per_day',
                'value' => '4',
                'type' => 'integer',
                'description' => 'Horas por día para tickets',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
