<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class OwnerBankAccount extends Model { protected $keyType='string'; public $incrementing=false; protected $fillable=['id','organization_id','owner_id','bank_name','iban','account_holder_name','account_number','swift_code','notes','is_default','status','version']; protected $casts=['is_default'=>'boolean']; public function owner(): BelongsTo { return $this->belongsTo(Owner::class); } }
