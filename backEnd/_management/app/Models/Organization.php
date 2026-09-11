<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['name', 'timezone', 'default_currency'];
}
