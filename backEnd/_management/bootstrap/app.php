<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: '',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->appendToGroup('api', \App\Http\Middleware\AssignRequestId::class);
        $middleware->alias([
            'api.auth' => \App\Http\Middleware\ApiAuthenticate::class,
            'permission' => \App\Http\Middleware\RequirePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Validation\ValidationException $exception, \Illuminate\Http\Request $request) {
            if (! $request->is('v1/*')) return null;
            return response()->json(['errors' => collect($exception->errors())->flatMap(fn ($messages, $field) => collect($messages)->map(fn ($message) => ['field' => $field, 'code' => 'validation', 'message' => $message]))->values(), 'meta' => ['requestId' => $request->attributes->get('request_id')]], 422);
        });
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $exception, \Illuminate\Http\Request $request) {
            if (! $request->is('v1/*')) return null;
            $message = $exception->getMessage() ?: match ($exception->getStatusCode()) {
                404 => 'المورد المطلوب غير موجود.', 409 => 'تعذر إتمام العملية بسبب تعارض في البيانات.', default => 'تعذر إتمام الطلب.',
            };
            return response()->json(['errors' => [['code' => 'request_failed', 'message' => $message]], 'meta' => ['requestId' => $request->attributes->get('request_id')]], $exception->getStatusCode());
        });
        $exceptions->render(function (\Throwable $exception, \Illuminate\Http\Request $request) {
            if (! $request->is('v1/*')) return null;
            report($exception);
            return response()->json(['errors' => [['code' => 'internal_error', 'message' => 'تعذر إتمام الطلب. يرجى إعادة المحاولة لاحقاً.']], 'meta' => ['requestId' => $request->attributes->get('request_id')]], 500);
        });
    })->create();
