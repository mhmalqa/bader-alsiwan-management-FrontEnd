<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_reversals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('payment_id')->unique();
            $table->text('reason');
            $table->unsignedBigInteger('reversed_by');
            $table->timestamp('reversed_at');
            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
        });
    }

    public function down(): void { Schema::dropIfExists('payment_reversals'); }
};
