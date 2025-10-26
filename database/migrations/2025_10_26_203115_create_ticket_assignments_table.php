<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ticket_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date'); // Date of the assignment
            $table->time('start_time'); // Start time of the assignment
            $table->time('end_time'); // End time of the assignment
            $table->decimal('hours', 8, 2)->default(4); // Hours for this assignment (always 4)
            $table->timestamps();

            // Composite index for faster queries
            $table->index(['user_id', 'date']);
            $table->index(['ticket_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_assignments');
    }
};
