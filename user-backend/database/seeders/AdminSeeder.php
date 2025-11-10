<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Admin default
        User::updateOrCreate(
            ['email' => 'admin@solana.app'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        // User biasa
        User::updateOrCreate(
            ['email' => 'user@solana.app'],
            [
                'name' => 'User',
                'password' => Hash::make('user123'),
                'role' => 'user',
            ]
        );
    }
}
