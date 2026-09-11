<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('owners', function (Blueprint $table): void {
            $table->uuid('id')->primary(); $table->uuid('organization_id')->index();
            $table->string('code', 50); $table->string('full_name', 200); $table->string('national_id_or_iqama', 50);
            $table->string('nationality', 80)->nullable(); $table->string('mobile', 30); $table->string('mobile_alternative', 30)->nullable();
            $table->string('email', 255)->nullable(); $table->string('city', 100); $table->string('district', 100)->nullable(); $table->json('address')->nullable();
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active'); $table->unsignedBigInteger('version')->default(1); $table->timestamps();
            $table->unique(['organization_id', 'code']); $table->unique(['organization_id', 'national_id_or_iqama']);
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });
        Schema::create('owner_bank_accounts', function (Blueprint $table): void {
            $table->uuid('id')->primary(); $table->uuid('organization_id')->index(); $table->uuid('owner_id')->index();
            $table->string('bank_name', 150); $table->string('iban', 34); $table->string('account_holder_name', 200); $table->string('account_number', 80)->nullable(); $table->string('swift_code', 20)->nullable(); $table->text('notes')->nullable();
            $table->boolean('is_default')->default(false); $table->enum('status', ['active', 'inactive', 'archived'])->default('active'); $table->unsignedBigInteger('version')->default(1); $table->timestamps();
            $table->unique(['organization_id', 'iban']); $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete(); $table->foreign('owner_id')->references('id')->on('owners')->cascadeOnDelete();
        });
    }
    public function down(): void { Schema::dropIfExists('owner_bank_accounts'); Schema::dropIfExists('owners'); }
};
