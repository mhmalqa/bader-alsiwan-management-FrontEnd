<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiSession extends Model
{
    protected $fillable = ['id', 'user_id', 'organization_id', 'token_hash', 'expires_at', 'ip_address', 'user_agent'];
    protected $casts = ['expires_at' => 'datetime', 'revoked_at' => 'datetime'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
