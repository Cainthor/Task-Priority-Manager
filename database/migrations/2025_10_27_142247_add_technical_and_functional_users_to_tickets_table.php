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
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreignId('technical_user_id')->nullable()->after('created_by')->constrained('users')->onDelete('set null');
            $table->foreignId('functional_user_id')->nullable()->after('technical_user_id')->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['technical_user_id']);
            $table->dropForeign(['functional_user_id']);
            $table->dropColumn(['technical_user_id', 'functional_user_id']);
        });
    }
};
