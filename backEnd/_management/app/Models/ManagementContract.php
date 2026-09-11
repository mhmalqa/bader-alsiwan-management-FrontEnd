<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class ManagementContract extends Model { protected $keyType='string'; public $incrementing=false; protected $fillable=['id','organization_id','owner_id','number','start_date','end_date','fee_method','percent_rate','fixed_amount','approval_threshold','status','version']; public function owner():BelongsTo{return $this->belongsTo(Owner::class);} public function scopes():HasMany{return $this->hasMany(ManagementContractScope::class);} public function services():HasMany{return $this->hasMany(ManagementContractService::class);} public function exclusions():HasMany{return $this->hasMany(ManagementContractExclusion::class);} }
