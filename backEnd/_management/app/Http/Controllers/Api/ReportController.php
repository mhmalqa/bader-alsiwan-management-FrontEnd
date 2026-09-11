<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use App\Services\ReportExportFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    private const KEYS = ['collections', 'expenses', 'owner-statement', 'tenant-statement', 'property', 'occupancy', 'overdue', 'upcoming', 'management-portfolio'];

    public function show(Request $request, string $key): JsonResponse { return $this->success($this->report($request, $key)); }

    public function export(Request $request, string $key): JsonResponse
    {
        $input = $request->validate(['format' => ['required', 'in:csv,xlsx,pdf,docx'], 'filters' => ['nullable', 'array']]);
        $organizationId = $request->attributes->get('organization_id'); $report = $this->report($request, $key); $file = ReportExportFormatter::make($input['format'], $report['metrics']);
        $id = (string) Str::uuid(); $filename = "{$key}-".now()->format('YmdHis').'.'.$file['extension']; $storageKey = "organizations/{$organizationId}/exports/{$id}.{$file['extension']}";
        Storage::disk(config('filesystems.default'))->put($storageKey, $file['content']);
        DB::table('export_jobs')->insert(['id' => $id, 'organization_id' => $organizationId, 'report_key' => $key, 'format' => $input['format'], 'filters' => json_encode($input['filters'] ?? []), 'status' => 'completed', 'storage_key' => $storageKey, 'filename' => $filename, 'requested_by' => $request->user()->id, 'completed_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
        AuditService::record($organizationId, $request->user()->id, 'report.exported', 'export_job', $id, null, ['reportKey' => $key, 'format' => $input['format']]);
        return $this->success(['id' => $id, 'status' => 'completed', 'filename' => $filename, 'downloadUrl' => url("/api/v1/export-jobs/{$id}/download")], [], 201);
    }

    public function download(Request $request, string $id): JsonResponse
    {
        $job = DB::table('export_jobs')->where('organization_id', $request->attributes->get('organization_id'))->where('id', $id)->where('status', 'completed')->first();
        abort_if(!$job || !Storage::disk(config('filesystems.default'))->exists($job->storage_key), 404);
        $types = ['csv' => 'text/csv; charset=utf-8', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'pdf' => 'application/pdf'];
        return $this->success(['id' => $job->id, 'filename' => $job->filename, 'contentType' => $types[$job->format] ?? 'application/octet-stream', 'content' => Storage::disk(config('filesystems.default'))->get($job->storage_key)]);
    }

    private function report(Request $request, string $key): array
    {
        abort_unless(in_array($key, self::KEYS, true), 404);
        $organizationId = $request->attributes->get('organization_id'); $from = $request->query('from'); $to = $request->query('to');
        $payments = DB::table('payments')->where('organization_id', $organizationId)->where('status', 'confirmed')->when($from, fn ($query) => $query->whereDate('receipt_date', '>=', $from))->when($to, fn ($query) => $query->whereDate('receipt_date', '<=', $to));
        $expenses = DB::table('expenses')->where('organization_id', $organizationId)->where('status', 'confirmed')->when($from, fn ($query) => $query->whereDate('expense_date', '>=', $from))->when($to, fn ($query) => $query->whereDate('expense_date', '<=', $to));
        $metrics = ['collections' => (float) (clone $payments)->sum('amount'), 'paymentsCount' => (clone $payments)->count(), 'expenses' => (float) (clone $expenses)->sum('gross_amount'), 'expensesCount' => (clone $expenses)->count()];
        if ($key === 'occupancy') { $metrics['spacesCount'] = DB::table('property_spaces')->where('organization_id', $organizationId)->count(); $metrics['activeLeases'] = DB::table('leases')->where('organization_id', $organizationId)->where('status', 'active')->count(); }
        if ($key === 'overdue') $metrics['openReceivables'] = DB::table('receivables')->where('organization_id', $organizationId)->whereDate('due_date', '<', today())->whereNull('cancelled_at')->count();
        return ['reportKey' => $key, 'filters' => ['from' => $from, 'to' => $to], 'metrics' => $metrics];
    }
}
