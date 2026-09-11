<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Owner extends Model { protected $keyType='string'; public $incrementing=false; protected $fillable=['id','organization_id','code','full_name','national_id_or_iqama','nationality','mobile','mobile_alternative','email','city','district','address','status','version']; protected $casts=['address'=>'array']; public function bankAccounts(): HasMany { return $this->hasMany(OwnerBankAccount::class); } }
