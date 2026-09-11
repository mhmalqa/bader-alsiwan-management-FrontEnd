<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Receivable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function reverse(string $organizationId, int $actorId, string $paymentId, string $reason): Payment
    {
        return DB::transaction(function () use ($organizationId, $actorId, $paymentId, $reason): Payment {
            $payment = Payment::query()->where('organization_id', $organizationId)->lockForUpdate()->findOrFail($paymentId);
            if ($payment->status !== 'confirmed') abort(409, 'لا يمكن عكس دفعة غير مؤكدة أو معكوسة.');
            $payment->update(['status' => 'reversed']);
            DB::table('payment_reversals')->insert(['id' => (string) Str::uuid(), 'payment_id' => $payment->id, 'reason' => $reason, 'reversed_by' => $actorId, 'reversed_at' => now()]);
            AuditService::record($organizationId, $actorId, 'payment.reversed', 'payment', $payment->id, ['status' => 'confirmed'], ['status' => 'reversed', 'reason' => $reason]);
            return $payment->load('allocations');
        });
    }

    public function create(string $organizationId, int $actorId, array $data, string $idempotencyKey): Payment
    {
        return DB::transaction(function () use ($organizationId, $actorId, $data, $idempotencyKey): Payment {
            $existing = Payment::query()->where('organization_id', $organizationId)->where('idempotency_key', $idempotencyKey)->lockForUpdate()->first();
            if ($existing) {
                if ($existing->request_fingerprint !== $this->fingerprint($data)) abort(409, 'مفتاح التكرار مستخدم لطلب مختلف.');
                return $existing->load('allocations');
            }
            if (round((float) collect($data['allocations'])->sum('amount'), 2) !== round((float) $data['amount'], 2)) abort(422, 'مجموع التوزيعات لا يطابق مبلغ الدفعة.');
            $payment = Payment::create(['id' => (string) Str::uuid(), 'organization_id' => $organizationId, 'number' => $this->number(), 'tenant_id' => $data['tenantId'], 'receipt_date' => $data['receiptDate'], 'posting_date' => $data['postingDate'] ?? null, 'method' => $data['paymentMethod'], 'amount' => $data['amount'], 'currency' => $data['currency'], 'transaction_reference' => $data['transactionReference'] ?? null, 'status' => 'confirmed', 'idempotency_key' => $idempotencyKey, 'request_fingerprint' => $this->fingerprint($data), 'created_by' => $actorId]);
            foreach ($data['allocations'] as $allocation) {
                $receivable = Receivable::query()->where('organization_id', $organizationId)->lockForUpdate()->findOrFail($allocation['receivableId']);
                $allocated = (float) DB::table('payment_allocations')->join('payments', 'payments.id', '=', 'payment_allocations.payment_id')->where('payment_allocations.receivable_id', $receivable->id)->where('payments.status', 'confirmed')->sum('payment_allocations.amount');
                if ($receivable->tenant_id !== $payment->tenant_id || $receivable->cancelled_at || $allocated + (float) $allocation['amount'] > (float) $receivable->original_amount) abort(409, 'التوزيع يتجاوز رصيد الاستحقاق أو لا يتبع المستأجر.');
                DB::table('payment_allocations')->insert(['id' => (string) Str::uuid(), 'payment_id' => $payment->id, 'receivable_id' => $receivable->id, 'amount' => $allocation['amount']]);
            }
            AuditService::record($organizationId, $actorId, 'payment.confirmed', 'payment', $payment->id, null, ['amount' => $payment->amount]);
            return $payment->load('allocations');
        });
    }

    private function fingerprint(array $data): string
    {
        $canonical = $data;
        usort($canonical['allocations'], fn (array $a, array $b) => $a['receivableId'] <=> $b['receivableId']);
        return hash('sha256', json_encode($canonical, JSON_THROW_ON_ERROR));
    }

    private function number(): string { return 'PAY-'.now()->format('YmdHis').'-'.Str::upper(Str::random(8)); }
}
