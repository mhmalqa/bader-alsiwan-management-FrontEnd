<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $allowed = $request->user()?->permissions()->where('permissions.code', $permission)->exists() ?? false;
        if (! $allowed) {
            return response()->json(['errors' => [['code' => 'forbidden', 'message' => 'لا تملك الصلاحية المطلوبة لهذه العملية.']]], 403);
        }
        return $next($request);
    }
}
