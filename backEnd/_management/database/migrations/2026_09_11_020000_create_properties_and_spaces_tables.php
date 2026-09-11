<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('properties', function (Blueprint $table): void {
            $table->uuid('id')->primary(); $table->uuid('organization_id')->index(); $table->uuid('owner_id')->index();
            $table->string('code',50); $table->string('name',200); $table->string('property_type',80); $table->string('deed_number',100)->nullable();
            $table->string('city',100); $table->string('district',100); $table->json('address')->nullable(); $table->text('description')->nullable();
            $table->enum('status',['active','inactive','archived'])->default('active'); $table->unsignedBigInteger('version')->default(1); $table->timestamps();
            $table->unique(['organization_id','code']); $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete(); $table->foreign('owner_id')->references('id')->on('owners')->restrictOnDelete();
        });
        Schema::create('property_spaces', function (Blueprint $table): void {
            $table->uuid('id')->primary(); $table->uuid('organization_id')->index(); $table->uuid('property_id')->index(); $table->uuid('parent_space_id')->nullable()->index();
            $table->string('code',50); $table->string('name',200); $table->enum('space_type',['unit','floor','whole_property']); $table->string('floor',50)->nullable(); $table->decimal('area',12,2)->nullable(); $table->decimal('expected_annual_rent',18,2)->nullable();
            $table->string('electricity_meter_number',100)->nullable(); $table->string('water_meter_number',100)->nullable(); $table->text('notes')->nullable(); $table->enum('status',['active','inactive','archived','maintenance'])->default('active'); $table->unsignedBigInteger('version')->default(1); $table->timestamps();
            $table->unique(['property_id','code']); $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete(); $table->foreign('property_id')->references('id')->on('properties')->cascadeOnDelete(); $table->foreign('parent_space_id')->references('id')->on('property_spaces')->nullOnDelete();
        });
    }
    public function down(): void { Schema::dropIfExists('property_spaces'); Schema::dropIfExists('properties'); }
};
