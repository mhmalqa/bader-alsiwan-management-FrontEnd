<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name', 200);
            $table->string('timezone', 64)->default('Asia/Riyadh');
            $table->char('default_currency', 3)->default('SAR');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->uuid('organization_id')->nullable()->index()->after('id');
            $table->string('full_name', 200)->nullable()->after('organization_id');
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active')->after('password');
            $table->unsignedBigInteger('version')->default(1);
        });

        Schema::create('roles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->string('code', 80);
            $table->string('name', 150);
            $table->boolean('is_system')->default(false);
            $table->timestamps();
            $table->unique(['organization_id', 'code']);
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('permissions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('code', 120)->unique();
            $table->string('name', 200);
            $table->string('module', 80);
            $table->timestamps();
        });

        Schema::create('user_roles', function (Blueprint $table): void {
            $table->unsignedBigInteger('user_id');
            $table->uuid('role_id');
            $table->primary(['user_id', 'role_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
        });

        Schema::create('role_permissions', function (Blueprint $table): void {
            $table->uuid('role_id');
            $table->uuid('permission_id');
            $table->primary(['role_id', 'permission_id']);
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
        });

        Schema::create('api_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('user_id')->index();
            $table->uuid('organization_id')->index();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('revoked_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->unsignedBigInteger('actor_id')->nullable()->index();
            $table->string('action', 100);
            $table->string('entity_type', 80);
            $table->string('entity_id', 64);
            $table->json('before_json')->nullable();
            $table->json('after_json')->nullable();
            $table->uuid('request_id')->nullable()->index();
            $table->text('reason')->nullable();
            $table->timestamp('created_at', 3)->useCurrent();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('api_sessions');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['organization_id', 'full_name', 'status', 'version']);
        });
        Schema::dropIfExists('organizations');
    }
};
