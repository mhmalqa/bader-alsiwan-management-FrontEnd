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

class OwnerApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_and_bank_account_are_scoped_audited_and_validated(): void
    {
        $organizationId = (string) Str::uuid(); $otherOrganizationId = (string) Str::uuid();
        foreach ([$organizationId, $otherOrganizationId] as $id) DB::table('organizations')->insert(['id'=>$id,'name'=>'مؤسسة','timezone'=>'Asia/Riyadh','default_currency'=>'SAR','created_at'=>now(),'updated_at'=>now()]);
        $user = User::create(['organization_id'=>$organizationId,'name'=>'مدير','full_name'=>'مدير','email'=>'owner@test.local','password'=>Hash::make('password-long-enough'),'status'=>'active']);
        $permission = Permission::create(['id'=>(string) Str::uuid(),'code'=>'owners.manage','name'=>'إدارة الملاك','module'=>'owners']);
        $view = Permission::create(['id'=>(string) Str::uuid(),'code'=>'owners.view','name'=>'عرض الملاك','module'=>'owners']);
        $role = Role::create(['id'=>(string) Str::uuid(),'organization_id'=>$organizationId,'code'=>'manager','name'=>'مدير']); $role->permissions()->sync([$permission->id,$view->id]); $user->roles()->attach($role);
        $propertyView = Permission::create(['id'=>(string) Str::uuid(),'code'=>'properties.view','name'=>'Property view','module'=>'properties']); $role->permissions()->attach($propertyView->id);
        $token = Str::random(80); ApiSession::create(['id'=>(string) Str::uuid(),'user_id'=>$user->id,'organization_id'=>$organizationId,'token_hash'=>hash('sha256',$token),'expires_at'=>now()->addHour()]);
        $owner = $this->withToken($token)->postJson('/v1/owners',['ownerCode'=>'O-1','fullName'=>'مالك اختبار','nationalIdOrIqama'=>'1234567890','mobilePrimary'=>'0500000000','city'=>'الرياض'])->assertCreated()->json('data');
        $this->withToken($token)->postJson('/v1/owners/'.$owner['id'].'/bank-accounts',['bankName'=>'البنك','accountHolderName'=>'مالك اختبار','iban'=>'SA0380000000608010167519','isDefault'=>true])->assertCreated()->assertJsonPath('data.isDefault',true);
        $this->withToken($token)->getJson('/v1/owners/'.$owner['id'])->assertOk()->assertJsonCount(1,'data.bankAccounts');
        $this->assertDatabaseHas('audit_logs',['organization_id'=>$organizationId,'entity_id'=>$owner['id'],'action'=>'owner.created']);
        $propertyId = (string) Str::uuid(); $spaceId = (string) Str::uuid();
        DB::table('properties')->insert(['id'=>$propertyId,'organization_id'=>$organizationId,'owner_id'=>$owner['id'],'code'=>'P-1','name'=>'Portfolio property','property_type'=>'residential','city'=>'Riyadh','district'=>'North','status'=>'active','version'=>1,'created_at'=>now(),'updated_at'=>now()]);
        DB::table('property_spaces')->insert(['id'=>$spaceId,'organization_id'=>$organizationId,'property_id'=>$propertyId,'code'=>'U-1','name'=>'Unit 1','space_type'=>'unit','expected_annual_rent'=>12000,'status'=>'active','version'=>1,'created_at'=>now(),'updated_at'=>now()]);
        $this->withToken($token)->getJson('/v1/owners/'.$owner['id'].'/portfolio')->assertOk()->assertJsonPath('data.summary.propertiesCount',1)->assertJsonPath('data.summary.expectedAnnualRent','12000.00');
        $this->withToken($token)->getJson('/v1/properties/'.$propertyId.'/portfolio')->assertOk()->assertJsonCount(1, 'data.spaces');
        $this->withToken($token)->postJson('/v1/owners',['ownerCode'=>'O-2','fullName'=>'سيء','nationalIdOrIqama'=>'1234567891','mobilePrimary'=>'0500000001','city'=>'الرياض'])->assertCreated();
        $this->withToken($token)->postJson('/v1/owners/'.$owner['id'].'/bank-accounts',['bankName'=>'البنك','accountHolderName'=>'مالك اختبار','iban'=>'غير صالح'])->assertUnprocessable();
    }
}
