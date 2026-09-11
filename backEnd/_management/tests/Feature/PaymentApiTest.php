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

class PaymentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirmed_payment_is_idempotent_and_cannot_overallocate(): void
    {
        $organizationId = (string) Str::uuid();
        DB::table('organizations')->insert(['id' => $organizationId, 'name' => 'Test organization', 'timezone' => 'Asia/Riyadh', 'default_currency' => 'SAR', 'created_at' => now(), 'updated_at' => now()]);
        $user = User::create(['organization_id' => $organizationId, 'name' => 'Manager', 'full_name' => 'Manager', 'email' => 'payment@test.local', 'password' => Hash::make('password-long-enough'), 'status' => 'active']);
        $role = Role::create(['id' => (string) Str::uuid(), 'organization_id' => $organizationId, 'code' => 'manager', 'name' => 'Manager']);
        $permissions = collect(['payments.manage', 'payments.view', 'payments.reverse', 'receivables.view', 'banking.view', 'banking.import', 'banking.match', 'banking.unmatch'])->map(fn (string $code) => Permission::create(['id' => (string) Str::uuid(), 'code' => $code, 'name' => $code, 'module' => 'payments']));
        $role->permissions()->sync($permissions->pluck('id')); $user->roles()->attach($role);
        $token = Str::random(80); ApiSession::create(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'organization_id' => $organizationId, 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addHour()]);
        $tenantId = (string) Str::uuid(); $leaseId = (string) Str::uuid(); $installmentId = (string) Str::uuid(); $receivableId = (string) Str::uuid();
        DB::table('tenants')->insert(['id' => $tenantId, 'organization_id' => $organizationId, 'code' => 'T-1', 'full_name' => 'Tenant', 'national_id_or_iqama' => '123', 'mobile' => '0500000000', 'status' => 'active', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('leases')->insert(['id' => $leaseId, 'organization_id' => $organizationId, 'tenant_id' => $tenantId, 'internal_number' => 'L-1', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31', 'annual_rent' => 100, 'total_value' => 100, 'currency' => 'SAR', 'frequency' => 'one_time', 'status' => 'active', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('lease_installments')->insert(['id' => $installmentId, 'lease_id' => $leaseId, 'sequence_no' => 1, 'due_date' => '2026-01-01', 'original_amount' => 100]);
        DB::table('receivables')->insert(['id' => $receivableId, 'organization_id' => $organizationId, 'installment_id' => $installmentId, 'tenant_id' => $tenantId, 'due_date' => '2026-01-01', 'original_amount' => 100]);
        $payload = ['tenantId' => $tenantId, 'receiptDate' => '2026-01-01', 'paymentMethod' => 'bank_transfer', 'amount' => 100, 'currency' => 'SAR', 'allocations' => [['receivableId' => $receivableId, 'amount' => 100]]];
        $first = $this->withToken($token)->withHeader('Idempotency-Key', 'payment-1')->postJson('/v1/payments', $payload)->assertCreated()->json('data');
        $this->withToken($token)->withHeader('Idempotency-Key', 'payment-1')->postJson('/v1/payments', $payload)->assertCreated()->assertJsonPath('data.id', $first['id']);
        $this->assertDatabaseCount('payments', 1);
        $this->withToken($token)->withHeader('Idempotency-Key', 'payment-2')->postJson('/v1/payments', $payload)->assertConflict();
        $this->withToken($token)->withHeader('Idempotency-Key', 'payment-1')->postJson('/v1/payments', [...$payload, 'amount' => 99, 'allocations' => [['receivableId' => $receivableId, 'amount' => 99]]])->assertConflict();
        $this->withToken($token)->getJson('/v1/receivables')->assertOk()->assertJsonCount(0, 'data.items');
        $this->withToken($token)->postJson('/v1/payments/'.$first['id'].'/reverse', ['reason' => 'Duplicate bank entry'])->assertOk()->assertJsonPath('data.status', 'reversed');
        $this->assertDatabaseHas('payment_reversals', ['payment_id' => $first['id']]);
        $this->withToken($token)->getJson('/v1/receivables')->assertOk()->assertJsonCount(1, 'data.items')->assertJsonPath('data.items.0.balance', 100);
        $this->withToken($token)->postJson('/v1/payments/'.$first['id'].'/reverse', ['reason' => 'Duplicate bank entry'])->assertConflict();

        $accountId = (string) Str::uuid();
        DB::table('company_bank_accounts')->insert(['id'=>$accountId,'organization_id'=>$organizationId,'bank_name'=>'Bank','account_name'=>'Operations','iban'=>'SA'.str_repeat('1',22),'status'=>'active','created_at'=>now(),'updated_at'=>now()]);
        $import = $this->withToken($token)->postJson('/v1/bank-imports', ['bankAccountId'=>$accountId,'filename'=>'statement.csv','fileHash'=>hash('sha256','statement'), 'transactions'=>[['bookedDate'=>'2026-01-02','amount'=>100,'direction'=>'inbound','externalReference'=>'BANK-1']]])->assertCreated()->json('data');
        $bankTransactionId=$import['transactions'][0]['id'];
        $this->withToken($token)->postJson('/v1/bank-matches',['bankTransactionId'=>$bankTransactionId,'paymentId'=>$first['id'],'amount'=>100])->assertConflict();
        $secondPayload = [...$payload, 'transactionReference'=>'BANK-2'];
        $second=$this->withToken($token)->withHeader('Idempotency-Key','payment-3')->postJson('/v1/payments',$secondPayload)->assertCreated()->json('data');
        $firstMatch=$this->withToken($token)->postJson('/v1/bank-matches',['bankTransactionId'=>$bankTransactionId,'paymentId'=>$second['id'],'amount'=>60])->assertCreated()->json('data');
        $this->withToken($token)->postJson('/v1/bank-matches',['bankTransactionId'=>$bankTransactionId,'paymentId'=>$second['id'],'amount'=>41])->assertConflict();
        $this->withToken($token)->postJson('/v1/bank-matches',['bankTransactionId'=>$bankTransactionId,'paymentId'=>$second['id'],'amount'=>40])->assertCreated();
        $this->withToken($token)->getJson('/v1/bank-transactions?status=matched')->assertOk()->assertJsonCount(1,'data.items');
        $this->withToken($token)->deleteJson('/v1/bank-matches/'.$firstMatch['id'],['reason'=>'Incorrect reference'])->assertNoContent();
        $this->withToken($token)->getJson('/v1/bank-transactions?status=partially_matched')->assertOk()->assertJsonCount(1,'data.items');
    }
}
