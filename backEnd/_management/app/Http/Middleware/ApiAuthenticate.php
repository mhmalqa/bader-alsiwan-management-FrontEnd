<?php

namespace App\Http\Middleware;

use App\Models\ApiSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['errors' => [['code' => 'unauthenticated', 'message' => 'يلزم تسجيل الدخول.']]], 401);
        }

        $session = ApiSession::query()->with('user')
            ->where('token_hash', hash('sha256', $token))
            ->whereNull('revoked_at')->where('expires_at', '>', now())->first();
        if (! $session || ! $session->user || $session->user->status !== 'active') {
            return response()->json(['errors' => [['code' => 'unauthenticated', 'message' => 'انتهت الجلسة أو لم تعد صالحة.']]], 401);
        }

        $request->setUserResolver(fn () => $session->user);
        $request->attributes->set('organization_id', $session->organization_id);
        $request->attributes->set('api_session', $session);
        return $next($request);
    }
}
