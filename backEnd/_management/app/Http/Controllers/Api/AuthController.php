<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiSession;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $input = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string'], 'organizationId' => ['required', 'uuid']]);
        $user = User::query()->where('organization_id', $input['organizationId'])->where('email', $input['email'])->first();
        if (! $user || ! Hash::check($input['password'], $user->password) || $user->status !== 'active') {
            return response()->json(['errors' => [['code' => 'invalid_credentials', 'message' => 'بيانات تسجيل الدخول غير صحيحة.']]], 422);
        }
        [$rawToken, $session] = $this->newSession($request, $user);
        AuditService::record($user->organization_id, $user->id, 'auth.login', 'user', (string) $user->id);
        return $this->success(['accessToken' => $rawToken, 'expiresAt' => $session->expires_at->toISOString(), 'user' => $this->userPayload($user)]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $old = $request->attributes->get('api_session');
        $old->update(['revoked_at' => now()]);
        [$rawToken, $session] = $this->newSession($request, $request->user());
        return $this->success(['accessToken' => $rawToken, 'expiresAt' => $session->expires_at->toISOString(), 'user' => $this->userPayload($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->attributes->get('api_session')->update(['revoked_at' => now()]);
        AuditService::record($request->attributes->get('organization_id'), $request->user()->id, 'auth.logout', 'user', (string) $request->user()->id);
        return $this->success(['loggedOut' => true]);
    }

    public function me(Request $request): JsonResponse { return $this->success($this->userPayload($request->user())); }

    private function newSession(Request $request, User $user): array
    {
        $rawToken = Str::random(80);
        $session = ApiSession::create(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'organization_id' => $user->organization_id,
            'token_hash' => hash('sha256', $rawToken), 'expires_at' => now()->addMinutes(60), 'ip_address' => $request->ip(), 'user_agent' => substr((string) $request->userAgent(), 0, 65535)]);
        return [$rawToken, $session];
    }

    private function userPayload(User $user): array
    {
        return ['id' => (string) $user->id, 'organizationId' => $user->organization_id, 'fullName' => $user->full_name ?: $user->name,
            'email' => $user->email, 'permissions' => $user->permissions()->pluck('permissions.code')->values()];
    }
}
