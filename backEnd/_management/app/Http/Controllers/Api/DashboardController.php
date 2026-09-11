<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');
        $asOf = $request->date('asOfDate') ?? now();
        $reminderDays = min(90, max(1, (int) $request->integer('reminderDays', 10)));
        $payments = (float) DB::table('payments')->where('organization_id', $organizationId)->where('status', 'confirmed')->sum('amount');
        $settlements = DB::table('owner_settlements')->where('organization_id', $organizationId)->where('status', 'confirmed');
        $receivables = DB::table('receivables as receivable')->leftJoin('payment_allocations as allocation', 'allocation.receivable_id', '=', 'receivable.id')->leftJoin('payments as payment', function ($join): void { $join->on('payment.id', '=', 'allocation.payment_id')->where('payment.status', '=', 'confirmed'); })->leftJoin('tenants as tenant', 'tenant.id', '=', 'receivable.tenant_id')->where('receivable.organization_id', $organizationId)->whereNull('receivable.cancelled_at')->select('receivable.id', 'receivable.tenant_id', 'tenant.full_name as tenant_name', 'receivable.due_date', 'receivable.original_amount', DB::raw('COALESCE(SUM(CASE WHEN payment.id IS NULL THEN 0 ELSE allocation.amount END), 0) as paid_amount'))->groupBy('receivable.id', 'receivable.tenant_id', 'tenant.full_name', 'receivable.due_date', 'receivable.original_amount')->get()->map(function ($receivable) use ($asOf): array { $balance = max(0, (float) $receivable->original_amount - (float) $receivable->paid_amount); return ['id' => $receivable->id, 'tenantId' => $receivable->tenant_id, 'tenantName' => $receivable->tenant_name, 'dueDate' => $receivable->due_date, 'balance' => $balance, 'days' => $asOf->startOfDay()->diffInDays($receivable->due_date, false)]; })->filter(fn (array $item) => $item['balance'] > 0)->values();
        $overdue = $receivables->filter(fn (array $item) => $item['days'] < 0)->values();
        $upcoming = $receivables->filter(fn (array $item) => $item['days'] >= 0 && $item['days'] <= $reminderDays)->values();
        return $this->success(['asOfDate' => $asOf->toDateString(), 'reminderDays' => $reminderDays, 'metrics' => ['confirmedCollections' => $payments, 'outstandingBalance' => (float) $receivables->sum('balance'), 'ownerNetDue' => (float) (clone $settlements)->sum('net_due'), 'ownerRemainingBalance' => (float) (clone $settlements)->sum('remaining_balance')], 'overdue' => $overdue, 'upcoming' => $upcoming]);
    }
}
