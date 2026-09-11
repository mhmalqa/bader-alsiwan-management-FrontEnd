<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Property extends Model { protected $keyType='string'; public $incrementing=false; protected $fillable=['id','organization_id','owner_id','code','name','property_type','deed_number','city','district','address','description','status','version']; protected $casts=['address'=>'array']; public function owner(): BelongsTo{return $this->belongsTo(Owner::class);} public function spaces(): HasMany{return $this->hasMany(PropertySpace::class);} }
