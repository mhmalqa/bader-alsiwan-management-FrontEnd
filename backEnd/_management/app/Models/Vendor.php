<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model; class Vendor extends Model {protected $keyType='string';public $incrementing=false;protected $fillable=['id','organization_id','code','name','mobile','email','tax_number','status'];}
