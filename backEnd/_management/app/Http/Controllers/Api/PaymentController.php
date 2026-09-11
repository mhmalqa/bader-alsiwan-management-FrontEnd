<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Receivable;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()->where('organization_id', $request->attributes->get('organization_id'))->with('allocations');
        foreach (['status', 'method'] as $filter) if ($request->filled($filter)) $query->where($filter, $request->string($filter));
        if ($request->filled('from')) $query->whereDate('receipt_date', '>=', $request->string('from'));
        if ($request->filled('to')) $query->whereDate('receipt_date', '<=', $request->string('to'));
        return $this->success(['items' => $query->latest('receipt_date')->get()->map(fn (Payment $payment) => $this->paymentData($payment))]);
    }

    public function openReceivables(Request $request): JsonResponse
    {
        $asOf = $request->date('asOfDate') ?? now();
        $items = Receivable::query()->where('organization_id', $request->attributes->get('organization_id'))->whereNull('cancelled_at')->get()->map(function (Receivable $receivable) use ($asOf): array {
            $paid = Payment::query()->where('status', 'confirmed')->whereHas('allocations', fn ($query) => $query->where('receivable_id', $receivable->id))->get()->flatMap->allocations->where('receivable_id', $receivable->id)->sum('amount');
            $installment = \Illuminate\Support\Facades\DB::table('lease_installments')->where('id', $receivable->installment_id)->first();
            $lease = $installment ? \Illuminate\Support\Facades\DB::table('leases')->where('organization_id', $receivable->organization_id)->where('id', $installment->lease_id)->first() : null;
            $space = $lease ? \Illuminate\Support\Facades\DB::table('lease_spaces')->where('lease_id', $lease->id)->orderBy('property_space_id')->first() : null;
            $propertySpace = $space ? \Illuminate\Support\Facades\DB::table('property_spaces')->where('organization_id', $receivable->organization_id)->where('id', $space->property_space_id)->first() : null;
            $property = $propertySpace ? \Illuminate\Support\Facades\DB::table('properties')->where('organization_id', $receivable->organization_id)->where('id', $propertySpace->property_id)->first() : null;
            $tenant = \Illuminate\Support\Facades\DB::table('tenants')->where('organization_id', $receivable->organization_id)->where('id', $receivable->tenant_id)->first();
            $balance = max(0, (float) $receivable->original_amount - (float) $paid);
            $status = $balance <= 0 ? 'paid' : ($asOf->toDateString() > $receivable->due_date ? 'overdue' : ($asOf->toDateString() === $receivable->due_date ? 'due_today' : 'upcoming'));
            return ['id' => $receivable->id, 'tenantId' => $receivable->tenant_id, 'tenantName' => $tenant?->full_name, 'leaseId' => $lease?->id, 'leaseNumber' => $lease?->internal_number, 'propertyId' => $property?->id, 'propertyName' => $property?->name, 'spaceId' => $propertySpace?->id, 'spaceName' => $propertySpace?->name, 'installmentNumber' => $installment?->sequence_no, 'dueDate' => $receivable->due_date, 'originalAmount' => (float) $receivable->original_amount, 'paidAmount' => (float) $paid, 'balance' => $balance, 'status' => $status];
        })->filter(fn (array $item) => $item['balance'] > 0)
            ->when($request->filled('tenantId'), fn ($items) => $items->where('tenantId', $request->string('tenantId')->toString()))
            ->when($request->filled('propertyId'), fn ($items) => $items->where('propertyId', $request->string('propertyId')->toString()))
            ->when($request->filled('status'), fn ($items) => $items->where('status', $request->string('status')->toString()))->values();
        return $this->success(['items' => $items]);
    }

    public function store(Request $request, PaymentService $payments): JsonResponse
    {
        $data = $request->validate(['tenantId' => ['required', 'uuid'], 'receiptDate' => ['required', 'date'], 'postingDate' => ['nullable', 'date'], 'paymentMethod' => ['required', 'in:bank_transfer,cash,cheque,card,other'], 'amount' => ['required', 'numeric', 'gt:0'], 'currency' => ['required', 'string', 'size:3'], 'transactionReference' => ['nullable', 'string', 'max:150'], 'allocations' => ['required', 'array', 'min:1'], 'allocations.*.receivableId' => ['required', 'uuid', 'distinct'], 'allocations.*.amount' => ['required', 'numeric', 'gt:0'], 'attachmentIds' => ['sometimes', 'array']]);
        $key = $request->header('Idempotency-Key');
        if (! is_string($key) || trim($key) === '' || strlen($key) > 100) abort(422, 'يلزم ترويس Idempotency-Key صالح.');
        $payment = $payments->create($request->attributes->get('organization_id'), $request->user()->id, $data, $key);
        return $this->success($this->paymentData($payment), [], 201);
    }

    public function reverse(Request $request, string $paymentId, PaymentService $payments): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']]);
        $payment = $payments->reverse($request->attributes->get('organization_id'), $request->user()->id, $paymentId, $data['reason']);
        return $this->success($this->paymentData($payment));
    }

    private function paymentData(Payment $payment): array
    {
        return ['id' => $payment->id, 'number' => $payment->number, 'tenantId' => $payment->tenant_id, 'receiptDate' => $payment->receipt_date, 'postingDate' => $payment->posting_date, 'paymentMethod' => $payment->method, 'amount' => $payment->amount, 'currency' => $payment->currency, 'transactionReference' => $payment->transaction_reference, 'status' => $payment->status, 'allocations' => $payment->allocations->map(fn ($a) => ['receivableId' => $a->receivable_id, 'amount' => $a->amount])->values()];
    }
}
