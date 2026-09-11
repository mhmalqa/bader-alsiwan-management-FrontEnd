<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Owner;
use App\Models\OwnerBankAccount;
use App\Models\Property;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OwnerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Owner::query()->where('organization_id', $request->attributes->get('organization_id'))->with('bankAccounts');
        if ($request->filled('status')) $query->where('status', $request->string('status'));
        if ($request->filled('search')) { $term = '%'.$request->string('search').'%'; $query->where(fn ($q) => $q->where('full_name', 'like', $term)->orWhere('code', 'like', $term)->orWhere('mobile', 'like', $term)); }
        $limit = min(max((int) $request->input('limit', 25), 1), 100);
        return $this->success(['items' => $query->orderBy('full_name')->paginate($limit)->through(fn (Owner $owner) => $this->payload($owner))->items(), 'nextCursor' => null]);
    }

    public function show(Request $request, string $ownerId): JsonResponse { return $this->success($this->payload($this->owner($request, $ownerId)->load('bankAccounts'))); }

    public function store(Request $request): JsonResponse
    {
        $input = $this->validateOwner($request, true); $organizationId = $request->attributes->get('organization_id');
        $owner = DB::transaction(fn () => Owner::create(array_merge($this->attributes($input), ['id' => (string) Str::uuid(), 'organization_id' => $organizationId])));
        AuditService::record($organizationId, $request->user()->id, 'owner.created', 'owner', $owner->id, null, $this->payload($owner));
        return $this->success($this->payload($owner), [], 201);
    }

    public function update(Request $request, string $ownerId): JsonResponse
    {
        $input = $this->validateOwner($request, false); $organizationId = $request->attributes->get('organization_id');
        $owner = DB::transaction(function () use ($request, $ownerId, $input, $organizationId): Owner {
            $owner = $this->owner($request, $ownerId, true); if ($owner->version !== $input['version']) abort(409, 'تم تعديل المالك من مستخدم آخر.');
            $before = $this->payload($owner); $owner->fill($this->attributes($input)); $owner->version++; $owner->save();
            AuditService::record($organizationId, $request->user()->id, 'owner.updated', 'owner', $owner->id, $before, $this->payload($owner)); return $owner;
        }); return $this->success($this->payload($owner));
    }

    public function portfolio(Request $request, string $ownerId): JsonResponse
    {
        $owner = $this->owner($request, $ownerId)->load('bankAccounts');
        $properties = Property::query()->where('organization_id', $request->attributes->get('organization_id'))->where('owner_id', $owner->id)->with('spaces')->orderBy('name')->get();
        $expectedAnnualRent = $properties->flatMap->spaces->sum(fn ($space) => (float) ($space->expected_annual_rent ?? 0));
        return $this->success(['owner' => $this->payload($owner), 'properties' => $properties->map(fn (Property $property) => ['id' => $property->id, 'propertyCode' => $property->code, 'propertyName' => $property->name, 'propertyType' => $property->property_type, 'city' => $property->city, 'district' => $property->district, 'status' => $property->status, 'spacesCount' => $property->spaces->count(), 'expectedAnnualRent' => (string) $property->spaces->sum(fn ($space) => (float) ($space->expected_annual_rent ?? 0))])->values(), 'summary' => ['expectedAnnualRent' => number_format($expectedAnnualRent, 2, '.', ''), 'propertiesCount' => $properties->count(), 'spacesCount' => $properties->flatMap->spaces->count()]]);
    }

    public function bankAccounts(Request $request, string $ownerId): JsonResponse { $this->owner($request, $ownerId); return $this->success(['items' => OwnerBankAccount::query()->where('organization_id', $request->attributes->get('organization_id'))->where('owner_id', $ownerId)->orderByDesc('is_default')->get()->map(fn ($account) => $this->bankPayload($account))]); }

    public function storeBankAccount(Request $request, string $ownerId): JsonResponse
    {
        $input = $request->validate(['bankName' => ['required', 'string', 'max:150'], 'iban' => ['required', 'string', 'regex:/^[A-Z]{2}[0-9A-Z]{13,32}$/'], 'accountHolderName' => ['required', 'string', 'max:200'], 'accountNumber' => ['nullable', 'string', 'max:80'], 'swiftCode' => ['nullable', 'string', 'max:20'], 'bankNotes' => ['nullable', 'string'], 'isDefault' => ['boolean']]);
        $organizationId = $request->attributes->get('organization_id'); $this->owner($request, $ownerId);
        $account = DB::transaction(function () use ($input, $organizationId, $ownerId): OwnerBankAccount { if ($input['isDefault'] ?? false) OwnerBankAccount::query()->where('organization_id', $organizationId)->where('owner_id', $ownerId)->lockForUpdate()->update(['is_default' => false]); return OwnerBankAccount::create(['id' => (string) Str::uuid(), 'organization_id' => $organizationId, 'owner_id' => $ownerId, 'bank_name' => $input['bankName'], 'iban' => strtoupper(str_replace(' ', '', $input['iban'])), 'account_holder_name' => $input['accountHolderName'], 'account_number' => $input['accountNumber'] ?? null, 'swift_code' => $input['swiftCode'] ?? null, 'notes' => $input['bankNotes'] ?? null, 'is_default' => $input['isDefault'] ?? false]); });
        AuditService::record($organizationId, $request->user()->id, 'owner_bank_account.created', 'owner_bank_account', $account->id, null, $this->bankPayload($account)); return $this->success($this->bankPayload($account), [], 201);
    }

    private function owner(Request $request, string $id, bool $lock = false): Owner { $query = Owner::query()->where('organization_id', $request->attributes->get('organization_id')); if ($lock) $query->lockForUpdate(); return $query->findOrFail($id); }
    private function validateOwner(Request $request, bool $create): array { $rules=['ownerCode'=>[$create?'required':'sometimes','string','max:50'], 'fullName'=>[$create?'required':'sometimes','string','max:200'], 'nationalIdOrIqama'=>[$create?'required':'sometimes','string','max:50'], 'mobilePrimary'=>[$create?'required':'sometimes','string','max:30'], 'email'=>['nullable','email','max:255'], 'city'=>[$create?'required':'sometimes','string','max:100'], 'district'=>['nullable','string','max:100'], 'nationality'=>['nullable','string','max:80'], 'mobileAlternative'=>['nullable','string','max:30'], 'address'=>['nullable','array'], 'status'=>['sometimes','in:active,inactive,archived']]; if(!$create) $rules['version']=['required','integer','min:1']; return $request->validate($rules); }
    private function attributes(array $input): array { return array_filter(['code'=>$input['ownerCode']??null,'full_name'=>$input['fullName']??null,'national_id_or_iqama'=>$input['nationalIdOrIqama']??null,'nationality'=>$input['nationality']??null,'mobile'=>$input['mobilePrimary']??null,'mobile_alternative'=>$input['mobileAlternative']??null,'email'=>$input['email']??null,'city'=>$input['city']??null,'district'=>$input['district']??null,'address'=>$input['address']??null,'status'=>$input['status']??null], fn($value)=>$value!==null); }
    private function payload(Owner $owner): array { return ['id'=>$owner->id,'ownerCode'=>$owner->code,'fullName'=>$owner->full_name,'nationalIdOrIqama'=>$owner->national_id_or_iqama,'nationality'=>$owner->nationality,'mobilePrimary'=>$owner->mobile,'mobileAlternative'=>$owner->mobile_alternative,'email'=>$owner->email,'city'=>$owner->city,'district'=>$owner->district,'address'=>$owner->address,'status'=>$owner->status,'version'=>$owner->version,'bankAccounts'=>$owner->relationLoaded('bankAccounts')?$owner->bankAccounts->map(fn($a)=>$this->bankPayload($a))->values():[]]; }
    private function bankPayload(OwnerBankAccount $account): array { return ['id'=>$account->id,'bankName'=>$account->bank_name,'iban'=>$account->iban,'accountHolderName'=>$account->account_holder_name,'accountNumber'=>$account->account_number,'swiftCode'=>$account->swift_code,'bankNotes'=>$account->notes,'isDefault'=>$account->is_default,'status'=>$account->status,'version'=>$account->version]; }
}
