<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditService;
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

    public function storeRole(Request $request): JsonResponse
    {
        $input = $request->validate(['code' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9._-]+$/'], 'name' => ['required', 'string', 'max:150'], 'permissionIds' => ['array'], 'permissionIds.*' => ['uuid']]);
        $organizationId = $request->attributes->get('organization_id');
        $role = \Illuminate\Support\Facades\DB::transaction(function () use ($input, $organizationId): Role {
            $permissions = Permission::query()->whereIn('id', $input['permissionIds'] ?? [])->lockForUpdate()->get();
            if ($permissions->count() !== count($input['permissionIds'] ?? [])) abort(422, 'إحدى الصلاحيات غير موجودة.');
            $role = Role::create(['id' => (string) \Illuminate\Support\Str::uuid(), 'organization_id' => $organizationId, 'code' => $input['code'], 'name' => $input['name']]);
            $role->permissions()->sync($permissions->pluck('id'));
            return $role->fresh('permissions');
        });
        AuditService::record($organizationId, $request->user()->id, 'role.created', 'role', $role->id, null, $this->roleData($role));
        return $this->success($this->roleData($role), [], 201);
    }

    public function updateRole(Request $request, string $roleId): JsonResponse
    {
        $input = $request->validate(['name' => ['sometimes', 'string', 'max:150'], 'permissionIds' => ['sometimes', 'array'], 'permissionIds.*' => ['uuid']]);
        $organizationId = $request->attributes->get('organization_id');
        $role = \Illuminate\Support\Facades\DB::transaction(function () use ($input, $organizationId, $roleId): Role {
            $role = Role::query()->where('organization_id', $organizationId)->lockForUpdate()->findOrFail($roleId);
            if ($role->is_system) abort(403, 'لا يمكن تعديل دور نظامي.');
            if (array_key_exists('permissionIds', $input)) {
                $permissions = Permission::query()->whereIn('id', $input['permissionIds'])->lockForUpdate()->get();
                if ($permissions->count() !== count($input['permissionIds'])) abort(422, 'إحدى الصلاحيات غير موجودة.');
                $role->permissions()->sync($permissions->pluck('id'));
            }
            $role->update(['name' => $input['name'] ?? $role->name]);
            return $role->fresh('permissions');
        });
        AuditService::record($organizationId, $request->user()->id, 'role.updated', 'role', $role->id, null, $this->roleData($role));
        return $this->success($this->roleData($role));
    }

    private function roleData(Role $role): array { return ['id' => $role->id, 'code' => $role->code, 'name' => $role->name, 'isSystem' => $role->is_system, 'permissions' => $role->permissions->map(fn (Permission $permission) => ['id' => $permission->id, 'code' => $permission->code, 'name' => $permission->name, 'module' => $permission->module])->values()]; }
}
