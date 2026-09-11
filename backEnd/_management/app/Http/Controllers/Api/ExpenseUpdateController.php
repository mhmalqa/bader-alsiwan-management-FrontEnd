<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Property;
use App\Models\PropertySpace;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseUpdateController extends Controller
{
    public function update(Request $request, string $expenseId): JsonResponse
    {
        $data = $request->validate(['version' => ['required', 'integer', 'min:1'], 'propertyId' => ['required', 'uuid'], 'spaceId' => ['nullable', 'uuid'], 'vendorId' => ['nullable', 'uuid'], 'vendorName' => ['nullable', 'string', 'max:200'], 'description' => ['required', 'string', 'max:5000'], 'category' => ['required', 'string', 'max:80'], 'netAmount' => ['required', 'numeric', 'gte:0'], 'vatAmount' => ['nullable', 'numeric', 'gte:0'], 'grossAmount' => ['nullable', 'numeric', 'gte:0'], 'expenseDate' => ['required', 'date'], 'invoiceNumber' => ['nullable', 'string', 'max:100'], 'chargeableToOwner' => ['required', 'boolean']]);
        $organizationId = $request->attributes->get('organization_id');
        $expense = DB::transaction(function () use ($request, $expenseId, $data, $organizationId) {
            $expense = Expense::where('organization_id', $organizationId)->lockForUpdate()->findOrFail($expenseId);
            abort_if($expense->status !== 'draft', 409, 'لا يمكن تعديل مصروف مؤكد أو ملغى.');
            abort_if((int) $expense->version !== (int) $data['version'], 409, 'تم تعديل المصروف من مستخدم آخر؛ حدّث الصفحة ثم أعد المحاولة.');
            $property = Property::where('organization_id', $organizationId)->findOrFail($data['propertyId']);
            if ($data['spaceId'] ?? null) abort_unless(PropertySpace::where('organization_id', $organizationId)->where('property_id', $property->id)->whereKey($data['spaceId'])->exists(), 422, 'المساحة لا تتبع العقار.');
            $gross = round((float) $data['netAmount'] + (float) ($data['vatAmount'] ?? 0), 2);
            abort_if(isset($data['grossAmount']) && round((float) $data['grossAmount'], 2) !== $gross, 422, 'إجمالي المصروف لا يطابق الصافي والضريبة.');
            $before = $expense->toArray();
            $expense->update(['property_id' => $property->id, 'space_id' => $data['spaceId'] ?? null, 'vendor_id' => $data['vendorId'] ?? null, 'vendor_name' => $data['vendorName'] ?? null, 'description' => $data['description'], 'category' => $data['category'], 'net_amount' => $data['netAmount'], 'vat_amount' => $data['vatAmount'] ?? 0, 'gross_amount' => $gross, 'expense_date' => $data['expenseDate'], 'invoice_number' => $data['invoiceNumber'] ?? null, 'chargeable_to_owner' => $data['chargeableToOwner'], 'version' => $expense->version + 1]);
            AuditService::record($organizationId, $request->user()->id, 'expense.updated', 'expense', $expense->id, $before, $expense->fresh()->toArray());
            return $expense->fresh();
        });
        return $this->success($this->data($expense));
    }

    private function data(Expense $expense): array
    {
        return ['id' => $expense->id, 'propertyId' => $expense->property_id, 'spaceId' => $expense->space_id, 'ownerId' => $expense->owner_id, 'vendorId' => $expense->vendor_id, 'vendorName' => $expense->vendor_name, 'description' => $expense->description, 'category' => $expense->category, 'netAmount' => (float) $expense->net_amount, 'vatAmount' => (float) $expense->vat_amount, 'grossAmount' => (float) $expense->gross_amount, 'expenseDate' => $expense->expense_date, 'invoiceNumber' => $expense->invoice_number, 'chargeableToOwner' => (bool) $expense->chargeable_to_owner, 'approvalStatus' => $expense->approval_status, 'status' => $expense->status, 'version' => $expense->version];
    }
}
