<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class PropertySpace extends Model { protected $keyType='string'; public $incrementing=false; protected $fillable=['id','organization_id','property_id','parent_space_id','code','name','space_type','floor','area','expected_annual_rent','electricity_meter_number','water_meter_number','notes','status','version']; public function property(): BelongsTo{return $this->belongsTo(Property::class);} }
