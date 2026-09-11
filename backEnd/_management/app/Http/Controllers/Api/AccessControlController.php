<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccessControlController extends Controller
{
    public function roles(Request $request): JsonResponse
    {
        $roles = Role::query()->where('organization_id', $request->attributes->get('organization_id'))->with('permissions:id,code,name,module')->get();
        return $this->success(['items' => $roles]);
    }

    public function permissions(): JsonResponse { return $this->success(['items' => Permission::query()->orderBy('module')->orderBy('code')->get()]); }
}
