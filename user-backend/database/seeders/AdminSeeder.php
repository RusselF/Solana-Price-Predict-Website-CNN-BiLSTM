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
        User::create([
            'name' => 'Admin',
            'email' => 'admin@solana.app',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // Contoh user biasa (opsional)
        User::create([
            'name' => 'User Demo',
            'email' => 'user@solana.app',
            'password' => Hash::make('user123'),
            'role' => 'user',
        ]);
    }
}