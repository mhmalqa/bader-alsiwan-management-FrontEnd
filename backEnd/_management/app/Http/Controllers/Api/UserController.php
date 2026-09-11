<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = User::query()->where('organization_id', $request->attributes->get('organization_id'))
            ->with('roles:id,code,name')->orderBy('full_name')->get()->map(fn (User $user) => $this->payload($user));
        return $this->success(['items' => $items]);
    }

    public function store(Request $request): JsonResponse
    {
        $input = $request->validate(['fullName' => ['required', 'string', 'max:200'], 'email' => ['required', 'email', 'max:255'], 'password' => ['required', 'string', 'min:12'], 'roleIds' => ['array'], 'roleIds.*' => ['uuid'], 'status' => ['sometimes', 'in:active,inactive']]);
        $organizationId = $request->attributes->get('organization_id');
        $user = DB::transaction(function () use ($input, $organizationId): User {
            $roles = Role::query()->where('organization_id', $organizationId)->whereIn('id', $input['roleIds'] ?? [])->lockForUpdate()->get();
            if ($roles->count() !== count($input['roleIds'] ?? [])) abort(422, 'أحد الأدوار لا يتبع للمؤسسة.');
            $user = User::create(['organization_id' => $organizationId, 'name' => $input['fullName'], 'full_name' => $input['fullName'], 'email' => $input['email'], 'password' => Hash::make($input['password']), 'status' => $input['status'] ?? 'active']);
            $user->roles()->sync($roles->pluck('id'));
            return $user->fresh('roles');
        });
        AuditService::record($organizationId, $request->user()->id, 'user.created', 'user', (string) $user->id, null, $this->payload($user));
        return $this->success($this->payload($user), [], 201);
    }

    public function update(Request $request, int $userId): JsonResponse
    {
        $input = $request->validate(['fullName' => ['sometimes', 'string', 'max:200'], 'roleIds' => ['sometimes', 'array'], 'roleIds.*' => ['uuid'], 'status' => ['sometimes', 'in:active,inactive,archived'], 'version' => ['required', 'integer', 'min:1']]);
        $organizationId = $request->attributes->get('organization_id');
        $user = DB::transaction(function () use ($input, $organizationId, $userId): User {
            $user = User::query()->where('organization_id', $organizationId)->lockForUpdate()->findOrFail($userId);
            if ($user->version !== $input['version']) abort(409, 'تم تعديل المستخدم من مستخدم آخر.');
            $before = $this->payload($user->load('roles'));
            if (array_key_exists('roleIds', $input)) {
                $roles = Role::query()->where('organization_id', $organizationId)->whereIn('id', $input['roleIds'])->lockForUpdate()->get();
                if ($roles->count() !== count($input['roleIds'])) abort(422, 'أحد الأدوار لا يتبع للمؤسسة.');
                $user->roles()->sync($roles->pluck('id'));
            }
            $user->fill(['name' => $input['fullName'] ?? $user->name, 'full_name' => $input['fullName'] ?? $user->full_name, 'status' => $input['status'] ?? $user->status]);
            $user->version++; $user->save();
            AuditService::record($organizationId, request()->user()->id, 'user.updated', 'user', (string) $user->id, $before, $this->payload($user->fresh('roles')));
            return $user->fresh('roles');
        });
        return $this->success($this->payload($user));
    }

    private function payload(User $user): array
    {
        return ['id' => (string) $user->id, 'fullName' => $user->full_name ?: $user->name, 'email' => $user->email, 'status' => $user->status, 'version' => $user->version, 'roles' => $user->roles->map(fn (Role $role) => ['id' => $role->id, 'code' => $role->code, 'name' => $role->name])->values()];
    }
}
