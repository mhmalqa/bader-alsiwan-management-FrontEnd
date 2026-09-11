<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;class PaymentAllocation extends Model{public $timestamps=false;protected $keyType='string';public $incrementing=false;protected $fillable=['id','payment_id','receivable_id','amount'];}
