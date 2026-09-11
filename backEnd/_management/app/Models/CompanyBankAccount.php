<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class CompanyBankAccount extends Model { protected $keyType='string'; public $incrementing=false; protected $fillable=['id','organization_id','bank_name','account_name','iban','status']; }
