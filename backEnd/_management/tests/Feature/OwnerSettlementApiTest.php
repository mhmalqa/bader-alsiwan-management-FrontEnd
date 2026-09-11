<?php

namespace Tests\Feature;

use App\Models\ApiSession;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class OwnerSettlementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_settlement_rejects_a_payment_from_another_owner_and_accepts_the_matching_owner(): void
    {
        [$organizationId, $token] = $this->authorizedOrganization();
        [$ownerA, $paymentA] = $this->ownerWithConfirmedPayment($organizationId, 'A');
        [, $paymentB] = $this->ownerWithConfirmedPayment($organizationId, 'B');

        $payload = ['ownerId' => $ownerA, 'fromDate' => '2026-01-01', 'toDate' => '2026-12-31', 'paymentIds' => [$paymentB]];
        $this->withToken($token)->postJson('/v1/owner-settlements/preview', $payload)->assertUnprocessable();
        $this->withToken($token)->withHeader('Idempotency-Key', 'settlement-owner-a')->postJson('/v1/owner-settlements', [...$payload, 'paymentIds' => [$paymentA]])
            ->assertCreated()->assertJsonPath('data.ownerId', $ownerA)->assertJsonPath('data.grossCollections', 100);
    }

    private function authorizedOrganization(): array
    {
        $organizationId = (string) Str::uuid();
        DB::table('organizations')->insert(['id' => $organizationId, 'name' => 'Organization', 'timezone' => 'Asia/Riyadh', 'default_currency' => 'SAR', 'created_at' => now(), 'updated_at' => now()]);
        $user = User::create(['organization_id' => $organizationId, 'name' => 'Manager', 'full_name' => 'Manager', 'email' => 'settlement@test.local', 'password' => Hash::make('password-long-enough'), 'status' => 'active']);
        $role = Role::create(['id' => (string) Str::uuid(), 'organization_id' => $organizationId, 'code' => 'manager', 'name' => 'Manager']);
        $permissions = collect(['settlements.view', 'settlements.manage', 'settlements.confirm', 'settlements.transfer'])->map(fn (string $code) => Permission::create(['id' => (string) Str::uuid(), 'code' => $code, 'name' => $code, 'module' => 'settlements']));
        $role->permissions()->sync($permissions->pluck('id')); $user->roles()->attach($role);
        $token = Str::random(80);
        ApiSession::create(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'organization_id' => $organizationId, 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addHour()]);
        return [$organizationId, $token];
    }

    private function ownerWithConfirmedPayment(string $organizationId, string $suffix): array
    {
        $ownerId = (string) Str::uuid(); $propertyId = (string) Str::uuid(); $spaceId = (string) Str::uuid(); $tenantId = (string) Str::uuid();
        $leaseId = (string) Str::uuid(); $installmentId = (string) Str::uuid(); $receivableId = (string) Str::uuid(); $paymentId = (string) Str::uuid();
        DB::table('owners')->insert(['id' => $ownerId, 'organization_id' => $organizationId, 'code' => "O-$suffix", 'full_name' => "Owner $suffix", 'national_id_or_iqama' => "OWNER-$suffix", 'mobile' => '0500000000', 'city' => 'Riyadh', 'status' => 'active', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('properties')->insert(['id' => $propertyId, 'organization_id' => $organizationId, 'owner_id' => $ownerId, 'code' => "P-$suffix", 'name' => "Property $suffix", 'property_type' => 'residential', 'city' => 'Riyadh', 'district' => 'North', 'status' => 'active', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('property_spaces')->insert(['id' => $spaceId, 'organization_id' => $organizationId, 'property_id' => $propertyId, 'code' => "U-$suffix", 'name' => "Unit $suffix", 'space_type' => 'unit', 'status' => 'active', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('tenants')->insert(['id' => $tenantId, 'organization_id' => $organizationId, 'code' => "T-$suffix", 'full_name' => "Tenant $suffix", 'national_id_or_iqama' => "ID-$suffix", 'mobile' => '0500000000', 'status' => 'active', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('leases')->insert(['id' => $leaseId, 'organization_id' => $organizationId, 'tenant_id' => $tenantId, 'internal_number' => "L-$suffix", 'start_date' => '2026-01-01', 'end_date' => '2026-12-31', 'annual_rent' => 100, 'total_value' => 100, 'currency' => 'SAR', 'frequency' => 'one_time', 'status' => 'active', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('lease_spaces')->insert(['lease_id' => $leaseId, 'property_space_id' => $spaceId, 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        DB::table('lease_installments')->insert(['id' => $installmentId, 'lease_id' => $leaseId, 'sequence_no' => 1, 'due_date' => '2026-01-01', 'original_amount' => 100]);
        DB::table('receivables')->insert(['id' => $receivableId, 'organization_id' => $organizationId, 'installment_id' => $installmentId, 'tenant_id' => $tenantId, 'due_date' => '2026-01-01', 'original_amount' => 100]);
        DB::table('payments')->insert(['id' => $paymentId, 'organization_id' => $organizationId, 'number' => "PAY-$suffix", 'tenant_id' => $tenantId, 'receipt_date' => '2026-06-01', 'method' => 'bank_transfer', 'amount' => 100, 'status' => 'confirmed', 'idempotency_key' => "payment-$suffix", 'created_at' => now(), 'updated_at' => now()]);
        DB::table('payment_allocations')->insert(['id' => (string) Str::uuid(), 'payment_id' => $paymentId, 'receivable_id' => $receivableId, 'amount' => 100]);
        return [$ownerId, $paymentId];
    }
}
