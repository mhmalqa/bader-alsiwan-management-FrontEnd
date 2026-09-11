<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model; class ManagementContractService extends Model { public $timestamps=false; protected $keyType='string'; public $incrementing=false; protected $fillable=['id','management_contract_id','service_code','notes']; }
