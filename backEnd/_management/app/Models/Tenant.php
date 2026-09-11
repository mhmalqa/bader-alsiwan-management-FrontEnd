<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model; class Tenant extends Model { protected $keyType='string'; public $incrementing=false; protected $fillable=['id','organization_id','code','full_name','national_id_or_iqama','mobile','email','nationality','employer','status','version']; }
