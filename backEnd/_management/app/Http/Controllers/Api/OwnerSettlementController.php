<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Owner;
use App\Models\OwnerBankAccount;
use App\Models\OwnerSettlement;
use App\Models\OwnerTransfer;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OwnerSettlementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = OwnerSettlement::where('organization_id', $request->attributes->get('organization_id'))->latest()->get()
            ->map(fn (OwnerSettlement $settlement) => $this->data($settlement));
        return $this->success(['items' => $items]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->success($this->detail($this->find($request, $id)));
    }

    public function preview(Request $request): JsonResponse
    {
        return $this->success($this->calculate($request, $this->input($request), false));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->input($request);
        $organizationId = $request->attributes->get('organization_id');
        $key = $request->header('Idempotency-Key');
        abort_unless($key && strlen($key) <= 100, 422, 'Idempotency-Key صالح مطلوب.');
        $fingerprint = hash('sha256', json_encode($data));

        $settlement = DB::transaction(function () use ($request, $data, $organizationId, $key, $fingerprint) {
            $existing = OwnerSettlement::where('organization_id', $organizationId)->where('idempotency_key', $key)->lockForUpdate()->first();
            if ($existing) {
                abort_if($existing->request_fingerprint !== $fingerprint, 409, 'مفتاح التكرار مستخدم لطلب مختلف.');
                return $existing;
            }
            $calculation = $this->calculate($request, $data, true);
            $settlement = OwnerSettlement::create([
                'id' => (string) Str::uuid(), 'organization_id' => $organizationId, 'owner_id' => $data['ownerId'],
                'number' => 'SET-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6)), 'period_start' => $data['fromDate'], 'period_end' => $data['toDate'],
                'gross_collections' => $calculation['grossCollections'], 'management_fees' => $calculation['managementFees'], 'owner_expenses' => $calculation['ownerExpenses'],
                'adjustments' => $calculation['adjustments'], 'net_due' => $calculation['netDue'], 'remaining_balance' => $calculation['netDue'],
                'status' => 'draft', 'idempotency_key' => $key, 'request_fingerprint' => $fingerprint,
            ]);
            foreach ($calculation['paymentItems'] as $item) DB::table('owner_settlement_payment_items')->insert(['id' => (string) Str::uuid(), 'settlement_id' => $settlement->id, 'payment_id' => $item['id'], 'allocated_amount' => $item['amount'], 'fee_amount' => $item['fee']]);
            foreach ($calculation['expenseItems'] as $item) DB::table('owner_settlement_expense_items')->insert(['id' => (string) Str::uuid(), 'settlement_id' => $settlement->id, 'expense_id' => $item['id'], 'allocated_amount' => $item['amount']]);
            foreach ($data['adjustments'] as $adjustment) DB::table('owner_settlement_adjustments')->insert(['id' => (string) Str::uuid(), 'settlement_id' => $settlement->id, 'adjustment_type' => $adjustment['type'], 'amount' => $adjustment['amount'], 'reason' => $adjustment['reason'], 'created_by' => $request->user()->id, 'created_at' => now()]);
            AuditService::record($organizationId, $request->user()->id, 'owner_settlement.created', 'owner_settlement', $settlement->id, null, $this->data($settlement));
            return $settlement;
        });
        return $this->success($this->detail($settlement), [], 201);
    }

    public function confirm(Request $request, string $id): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');
        $settlement = DB::transaction(function () use ($request, $id, $organizationId) {
            $settlement = $this->find($request, $id, true);
            abort_if($settlement->status !== 'draft', 409, 'التسوية ليست مسودة.');
            $paymentIds = DB::table('owner_settlement_payment_items')->where('settlement_id', $settlement->id)->pluck('payment_id')->all();
            $expenseIds = DB::table('owner_settlement_expense_items')->where('settlement_id', $settlement->id)->pluck('expense_id')->all();
            $this->assertItemsBelongToOwner($organizationId, $settlement->owner_id, $paymentIds, $expenseIds, []);
            foreach (DB::table('owner_settlement_payment_items')->where('settlement_id', $settlement->id)->lockForUpdate()->get() as $item) {
                $used = DB::table('owner_settlement_payment_items as item')->join('owner_settlements as settlement', 'settlement.id', '=', 'item.settlement_id')->where('item.payment_id', $item->payment_id)->where('settlement.status', 'confirmed')->lockForUpdate()->exists();
                abort_if($used, 409, 'أحد بنود الدفعات دخل في تسوية مؤكدة.');
            }
            foreach (DB::table('owner_settlement_expense_items')->where('settlement_id', $settlement->id)->lockForUpdate()->get() as $item) {
                $used = DB::table('owner_settlement_expense_items as item')->join('owner_settlements as settlement', 'settlement.id', '=', 'item.settlement_id')->where('item.expense_id', $item->expense_id)->where('settlement.status', 'confirmed')->lockForUpdate()->exists();
                abort_if($used, 409, 'أحد بنود المصروفات دخل في تسوية مؤكدة.');
            }
            $before = $this->data($settlement);
            $settlement->update(['status' => 'confirmed', 'confirmed_by' => $request->user()->id, 'confirmed_at' => now()]);
            AuditService::record($organizationId, $request->user()->id, 'owner_settlement.confirmed', 'owner_settlement', $settlement->id, $before, $this->data($settlement));
            return $settlement;
        });
        return $this->success($this->detail($settlement));
    }

    public function transfer(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['ownerBankAccountId' => ['required', 'uuid'], 'sourceCompanyBankAccountId' => ['nullable', 'uuid'], 'amount' => ['required', 'numeric', 'gt:0'], 'transferDate' => ['required', 'date'], 'transactionReference' => ['required', 'string', 'max:150']]);
        $organizationId = $request->attributes->get('organization_id');
        $transfer = DB::transaction(function () use ($request, $id, $data, $organizationId) {
            $settlement = $this->find($request, $id, true);
            abort_if($settlement->status !== 'confirmed', 409, 'لا يمكن التحويل من تسوية غير مؤكدة.');
            OwnerBankAccount::where('organization_id', $organizationId)->where('owner_id', $settlement->owner_id)->where('status', 'active')->lockForUpdate()->findOrFail($data['ownerBankAccountId']);
            if ($data['sourceCompanyBankAccountId'] ?? null) DB::table('company_bank_accounts')->where('organization_id', $organizationId)->where('status', 'active')->lockForUpdate()->findOrFail($data['sourceCompanyBankAccountId']);
            abort_if((float) $data['amount'] > (float) $settlement->remaining_balance, 409, 'قيمة التحويل تتجاوز المتبقي.');
            $transfer = OwnerTransfer::create(['id' => (string) Str::uuid(), 'settlement_id' => $settlement->id, 'owner_bank_account_id' => $data['ownerBankAccountId'], 'source_company_bank_account_id' => $data['sourceCompanyBankAccountId'] ?? null, 'transfer_date' => $data['transferDate'], 'amount' => $data['amount'], 'transaction_reference' => $data['transactionReference'], 'status' => 'confirmed', 'created_by' => $request->user()->id]);
            $settlement->update(['transfer_amount' => (float) $settlement->transfer_amount + (float) $data['amount'], 'remaining_balance' => (float) $settlement->remaining_balance - (float) $data['amount']]);
            AuditService::record($organizationId, $request->user()->id, 'owner_transfer.confirmed', 'owner_transfer', $transfer->id, null, ['settlementId' => $settlement->id, 'amount' => $data['amount']]);
            return $transfer;
        });
        return $this->success(['id' => $transfer->id, 'settlementId' => $transfer->settlement_id, 'amount' => (float) $transfer->amount, 'transferDate' => $transfer->transfer_date, 'transactionReference' => $transfer->transaction_reference], [], 201);
    }

    private function input(Request $request): array
    {
        return $request->validate(['ownerId' => ['required', 'uuid'], 'fromDate' => ['required', 'date'], 'toDate' => ['required', 'date', 'after_or_equal:fromDate'], 'propertyIds' => ['nullable', 'array'], 'propertyIds.*' => ['uuid'], 'paymentIds' => ['required', 'array', 'min:1'], 'paymentIds.*' => ['uuid', 'distinct'], 'expenseIds' => ['nullable', 'array'], 'expenseIds.*' => ['uuid', 'distinct'], 'adjustments' => ['nullable', 'array'], 'adjustments.*.amount' => ['required', 'numeric', 'not_in:0'], 'adjustments.*.reason' => ['required', 'string', 'max:500'], 'adjustments.*.type' => ['required', 'in:manual,rounding,correction']]) + ['adjustments' => [], 'expenseIds' => [], 'propertyIds' => []];
    }

    private function calculate(Request $request, array $data, bool $lock): array
    {
        $organizationId = $request->attributes->get('organization_id');
        Owner::where('organization_id', $organizationId)->findOrFail($data['ownerId']);
        $payments = DB::table('payments')->where('organization_id', $organizationId)->where('status', 'confirmed')->whereIn('id', $data['paymentIds'])->whereBetween('receipt_date', [$data['fromDate'], $data['toDate']])->when($lock, fn ($query) => $query->lockForUpdate())->get();
        abort_if($payments->count() !== count($data['paymentIds']), 422, 'الدفعات المحددة غير مؤهلة للتسوية.');
        $expenses = DB::table('expenses')->where('organization_id', $organizationId)->where('chargeable_to_owner', true)->where('status', 'confirmed')->whereIn('id', $data['expenseIds'])->whereBetween('expense_date', [$data['fromDate'], $data['toDate']])->when($lock, fn ($query) => $query->lockForUpdate())->get();
        abort_if($expenses->count() !== count($data['expenseIds']), 422, 'المصروفات المحددة غير مؤهلة للتسوية.');
        $this->assertItemsBelongToOwner($organizationId, $data['ownerId'], $data['paymentIds'], $data['expenseIds'], $data['propertyIds']);
        $gross = (float) $payments->sum('amount'); $ownerExpenses = (float) $expenses->sum('gross_amount'); $adjustments = (float) collect($data['adjustments'])->sum('amount');
        return ['grossCollections' => $gross, 'managementFees' => 0, 'ownerExpenses' => $ownerExpenses, 'adjustments' => $adjustments, 'netDue' => $gross - $ownerExpenses + $adjustments, 'paymentItems' => $payments->map(fn ($payment) => ['id' => $payment->id, 'amount' => (float) $payment->amount, 'fee' => 0])->all(), 'expenseItems' => $expenses->map(fn ($expense) => ['id' => $expense->id, 'amount' => (float) $expense->gross_amount])->all()];
    }

    /** A payment is eligible only when every receivable allocation belongs to this owner's scoped property. */
    private function assertItemsBelongToOwner(string $organizationId, string $ownerId, array $paymentIds, array $expenseIds, array $propertyIds): void
    {
        $paymentProperties = DB::table('payment_allocations as allocation')->join('receivables as receivable', 'receivable.id', '=', 'allocation.receivable_id')->join('lease_installments as installment', 'installment.id', '=', 'receivable.installment_id')->join('leases as lease', 'lease.id', '=', 'installment.lease_id')->join('lease_spaces as lease_space', 'lease_space.lease_id', '=', 'lease.id')->join('property_spaces as space', 'space.id', '=', 'lease_space.property_space_id')->join('properties as property', 'property.id', '=', 'space.property_id')->whereIn('allocation.payment_id', $paymentIds)->select('allocation.payment_id', 'property.id as property_id', 'property.owner_id')->get()->groupBy('payment_id');
        foreach ($paymentIds as $paymentId) {
            $properties = $paymentProperties->get($paymentId, collect());
            abort_if($properties->isEmpty() || $properties->contains(fn ($property) => $property->owner_id !== $ownerId || ($propertyIds && !in_array($property->property_id, $propertyIds, true))), 422, 'كل دفعة في التسوية يجب أن تخص عقارات المالك والنطاق المحدد فقط.');
        }
        $expenses = DB::table('expenses as expense')->join('properties as property', 'property.id', '=', 'expense.property_id')->where('expense.organization_id', $organizationId)->whereIn('expense.id', $expenseIds)->select('expense.id', 'expense.owner_id as expense_owner_id', 'property.id as property_id', 'property.owner_id as property_owner_id')->get()->keyBy('id');
        foreach ($expenseIds as $expenseId) {
            $expense = $expenses->get($expenseId);
            abort_if(!$expense || $expense->property_owner_id !== $ownerId || ($expense->expense_owner_id && $expense->expense_owner_id !== $ownerId) || ($propertyIds && !in_array($expense->property_id, $propertyIds, true)), 422, 'كل مصروف في التسوية يجب أن يخص المالك والنطاق المحدد فقط.');
        }
    }

    private function find(Request $request, string $id, bool $lock = false): OwnerSettlement
    {
        $query = OwnerSettlement::where('organization_id', $request->attributes->get('organization_id'));
        if ($lock) $query->lockForUpdate();
        return $query->findOrFail($id);
    }

    private function data(OwnerSettlement $settlement): array
    {
        return ['id' => $settlement->id, 'number' => $settlement->number, 'ownerId' => $settlement->owner_id, 'fromDate' => $settlement->period_start, 'toDate' => $settlement->period_end, 'grossCollections' => (float) $settlement->gross_collections, 'managementFees' => (float) $settlement->management_fees, 'ownerExpenses' => (float) $settlement->owner_expenses, 'adjustments' => (float) $settlement->adjustments, 'netDue' => (float) $settlement->net_due, 'transferAmount' => (float) $settlement->transfer_amount, 'remainingBalance' => (float) $settlement->remaining_balance, 'status' => $settlement->status];
    }

    private function detail(OwnerSettlement $settlement): array
    {
        $data = $this->data($settlement);
        $data['transfers'] = OwnerTransfer::where('settlement_id', $settlement->id)->get()->map(fn (OwnerTransfer $transfer) => ['id' => $transfer->id, 'amount' => (float) $transfer->amount, 'transferDate' => $transfer->transfer_date, 'transactionReference' => $transfer->transaction_reference, 'status' => $transfer->status]);
        return $data;
    }
}
