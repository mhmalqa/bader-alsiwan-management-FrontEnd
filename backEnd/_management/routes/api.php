<?php

use App\Http\Controllers\Api\AccessControlController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::middleware('api.auth')->group(function (): void {
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::get('/roles', [AccessControlController::class, 'roles'])->middleware('permission:settings.roles.view');
        Route::get('/permissions', [AccessControlController::class, 'permissions'])->middleware('permission:settings.roles.view');
    });
});
