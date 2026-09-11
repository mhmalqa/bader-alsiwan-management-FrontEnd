<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class BankMatch extends Model { public $timestamps=false; protected $keyType='string'; public $incrementing=false; protected $fillable=['id','bank_transaction_id','payment_id','owner_transfer_id','amount','matched_by','matched_at']; protected $casts=['matched_at'=>'datetime']; }
