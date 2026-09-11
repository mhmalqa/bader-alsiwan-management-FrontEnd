<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model; class ManagementContractExclusion extends Model { public $timestamps=false; protected $keyType='string'; public $incrementing=false; protected $fillable=['id','management_contract_id','exclusion_code','notes']; }
