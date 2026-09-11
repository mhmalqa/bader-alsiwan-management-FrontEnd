<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_a_session_and_the_authenticated_user(): void
    {
        [$organizationId] = $this->organization();
        $user = $this->user($organizationId, 'manager@example.test');

        $login = $this->postJson('/v1/auth/login', ['organizationId' => $organizationId, 'email' => $user->email, 'password' => 'secret-password']);
        $login->assertOk()->assertJsonPath('data.user.organizationId', $organizationId)->assertJsonStructure(['data' => ['accessToken', 'expiresAt', 'user'], 'meta' => ['requestId']]);
        $this->withToken($login->json('data.accessToken'))->getJson('/v1/auth/me')->assertOk()->assertJsonPath('data.id', (string) $user->id);
    }

    public function test_rbac_and_organization_boundary_are_enforced(): void
    {
        [$organizationId] = $this->organization();
        [$otherOrganizationId] = $this->organization();
        $user = $this->user($organizationId, 'reader@example.test');
        $token = $this->loginToken($organizationId, $user->email);
        $this->withToken($token)->getJson('/v1/roles')->assertForbidden();

        $permission = Permission::create(['id' => (string) Str::uuid(), 'code' => 'settings.roles.view', 'name' => 'عرض الأدوار', 'module' => 'settings']);
        $role = Role::create(['id' => (string) Str::uuid(), 'organization_id' => $organizationId, 'code' => 'reader', 'name' => 'قارئ']);
        $role->permissions()->attach($permission->id);
        $user->roles()->attach($role->id);
        Role::create(['id' => (string) Str::uuid(), 'organization_id' => $otherOrganizationId, 'code' => 'other', 'name' => 'مؤسسة أخرى']);

        $this->withToken($token)->getJson('/v1/roles')->assertOk()->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.organization_id', $organizationId);
    }

    public function test_role_and_user_management_are_authorized_and_audited(): void
    {
        [$organizationId] = $this->organization(); $user = $this->user($organizationId, 'admin@example.test');
        $permissions = collect(['settings.roles.view', 'settings.roles.manage', 'settings.users.view', 'settings.users.manage'])->map(fn (string $code) => Permission::create(['id' => (string) Str::uuid(), 'code' => $code, 'name' => $code, 'module' => 'settings']));
        $adminRole = Role::create(['id' => (string) Str::uuid(), 'organization_id' => $organizationId, 'code' => 'admin', 'name' => 'Admin']); $adminRole->permissions()->sync($permissions->pluck('id')); $user->roles()->attach($adminRole);
        $token = $this->loginToken($organizationId, $user->email);
        $role = $this->withToken($token)->postJson('/v1/roles', ['code' => 'collector', 'name' => 'Collector', 'permissionIds' => [$permissions->first()->id]])->assertCreated()->json('data');
        $created = $this->withToken($token)->postJson('/v1/users', ['fullName' => 'Collector User', 'email' => 'collector@example.test', 'password' => 'password-long-enough', 'roleIds' => [$role['id']]])->assertCreated()->json('data');
        $this->withToken($token)->patchJson('/v1/users/'.$created['id'], ['status' => 'inactive', 'version' => $created['version']])->assertOk()->assertJsonPath('data.status', 'inactive');
        $this->assertDatabaseHas('audit_logs', ['organization_id' => $organizationId, 'action' => 'role.created']);
        $this->assertDatabaseHas('audit_logs', ['organization_id' => $organizationId, 'action' => 'user.updated']);
    }

    private function organization(): array
    {
        $id = (string) Str::uuid();
        DB::table('organizations')->insert(['id' => $id, 'name' => 'اختبار', 'timezone' => 'Asia/Riyadh', 'default_currency' => 'SAR', 'created_at' => now(), 'updated_at' => now()]);
        return [$id];
    }

    private function user(string $organizationId, string $email): User
    {
        return User::create(['organization_id' => $organizationId, 'name' => 'مستخدم اختبار', 'full_name' => 'مستخدم اختبار', 'email' => $email, 'password' => Hash::make('secret-password'), 'status' => 'active']);
    }

    private function loginToken(string $organizationId, string $email): string
    {
        return $this->postJson('/v1/auth/login', ['organizationId' => $organizationId, 'email' => $email, 'password' => 'secret-password'])->assertOk()->json('data.accessToken');
    }
}
