<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'], // kalau sudah ada, update
            [
                'name' => 'Super Admin',
                'password' => Hash::make('123456'), // password default
                'role' => 'admin',
            ]
        );
    }
}
