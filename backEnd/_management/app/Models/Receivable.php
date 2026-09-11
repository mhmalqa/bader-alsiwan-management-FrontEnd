<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;class Receivable extends Model{public $timestamps=false;protected $keyType='string';public $incrementing=false;protected $fillable=['id','organization_id','installment_id','tenant_id','due_date','original_amount','cancelled_at','cancellation_reason'];}
