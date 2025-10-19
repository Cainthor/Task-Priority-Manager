<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Cristopher Fuentealba',
            'email' => 'cristopher.fuentealba@seidor.com',
            'password' => Hash::make('1234'),
        ]);
    }
}