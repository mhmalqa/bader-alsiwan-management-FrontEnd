<?php
use Illuminate\Database\Migrations\Migration;use Illuminate\Database\Schema\Blueprint;use Illuminate\Support\Facades\Schema;
return new class extends Migration{public function up():void{Schema::table('bank_matches',function(Blueprint $t){$t->uuid('owner_transfer_id')->nullable()->after('payment_id');$t->foreign('owner_transfer_id')->references('id')->on('owner_transfers')->restrictOnDelete();});}public function down():void{Schema::table('bank_matches',function(Blueprint $t){$t->dropForeign(['owner_transfer_id']);$t->dropColumn('owner_transfer_id');});}};
