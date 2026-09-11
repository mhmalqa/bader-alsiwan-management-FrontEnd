<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    public function organization(Request $request): JsonResponse
    {
        return $this->success($this->organizationData(Organization::query()->findOrFail($request->attributes->get('organization_id'))));
    }

    public function updateOrganization(Request $request): JsonResponse
    {
        $input = $request->validate(['name' => ['sometimes', 'string', 'max:200'], 'timezone' => ['sometimes', 'timezone'], 'defaultCurrency' => ['sometimes', 'string', 'size:3']]);
        $organizationId = $request->attributes->get('organization_id');
        $organization = DB::transaction(function () use ($input, $organizationId): Organization {
            $organization = Organization::query()->lockForUpdate()->findOrFail($organizationId); $before = $this->organizationData($organization);
            $organization->fill(['name' => $input['name'] ?? $organization->name, 'timezone' => $input['timezone'] ?? $organization->timezone, 'default_currency' => $input['defaultCurrency'] ?? $organization->default_currency]); $organization->save();
            AuditService::record($organizationId, request()->user()->id, 'organization.updated', 'organization', $organizationId, $before, $this->organizationData($organization)); return $organization;
        });
        return $this->success($this->organizationData($organization));
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $items = DB::table('audit_logs')->where('organization_id', $request->attributes->get('organization_id'))->latest('created_at')->limit(200)->get()->map(fn ($log) => ['id' => $log->id, 'action' => $log->action, 'entityType' => $log->entity_type, 'entityId' => $log->entity_id, 'before' => json_decode($log->before_json, true), 'after' => json_decode($log->after_json, true), 'createdAt' => $log->created_at]);
        return $this->success(['items' => $items]);
    }

    private function organizationData(Organization $organization): array { return ['id' => $organization->id, 'name' => $organization->name, 'timezone' => $organization->timezone, 'defaultCurrency' => $organization->default_currency]; }
}
