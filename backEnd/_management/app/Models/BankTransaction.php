<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class BankTransaction extends Model { protected $keyType='string'; public $incrementing=false; protected $fillable=['id','organization_id','bank_account_id','bank_import_id','booked_date','value_date','amount','direction','external_reference','status']; public function matches():HasMany{return $this->hasMany(BankMatch::class);} }
