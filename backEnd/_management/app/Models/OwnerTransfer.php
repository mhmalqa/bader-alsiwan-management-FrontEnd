<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;class OwnerTransfer extends Model{protected $keyType='string';public $incrementing=false;protected $fillable=['id','settlement_id','owner_bank_account_id','source_company_bank_account_id','transfer_date','amount','transaction_reference','status','created_by'];}
