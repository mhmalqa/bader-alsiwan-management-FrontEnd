<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuditService
{
    public static function record(string $organizationId, ?int $actorId, string $action, string $entityType, string $entityId, mixed $before = null, mixed $after = null, ?string $reason = null): void
    {
        DB::table('audit_logs')->insert([
            'id' => (string) Str::uuid(), 'organization_id' => $organizationId, 'actor_id' => $actorId,
            'action' => $action, 'entity_type' => $entityType, 'entity_id' => $entityId,
            'before_json' => $before ? json_encode($before, JSON_THROW_ON_ERROR) : null,
            'after_json' => $after ? json_encode($after, JSON_THROW_ON_ERROR) : null,
            'request_id' => request()?->attributes->get('request_id'), 'reason' => $reason, 'created_at' => now(),
        ]);
    }
}
