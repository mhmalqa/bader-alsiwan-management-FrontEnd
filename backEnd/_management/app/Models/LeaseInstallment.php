<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;class LeaseInstallment extends Model{public $timestamps=false;protected $keyType='string';public $incrementing=false;protected $fillable=['id','lease_id','sequence_no','due_date','original_amount','notes'];}
