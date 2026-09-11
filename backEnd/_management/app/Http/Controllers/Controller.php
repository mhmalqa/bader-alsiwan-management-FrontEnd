<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function success(mixed $data, array $meta = [], int $status = 200): \Illuminate\Http\JsonResponse
    {
        return response()->json(['data' => $data, 'meta' => array_merge(['requestId' => request()->attributes->get('request_id')], $meta)], $status);
    }
}
