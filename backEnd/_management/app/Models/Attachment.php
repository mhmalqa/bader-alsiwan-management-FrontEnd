<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;class Attachment extends Model{protected $keyType='string';public $incrementing=false;protected $fillable=['id','organization_id','entity_type','entity_id','storage_key','filename','mime_type','bytes','checksum','status','uploaded_by','uploaded_at'];}
