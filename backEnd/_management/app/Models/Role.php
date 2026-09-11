<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $keyType = 'string'; public $incrementing = false;
    protected $fillable = ['id', 'organization_id', 'code', 'name', 'is_system'];
    public function permissions(): BelongsToMany { return $this->belongsToMany(Permission::class, 'role_permissions'); }
}
