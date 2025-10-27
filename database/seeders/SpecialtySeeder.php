<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SpecialtySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $specialties = [
            // Technical specialties
            ['name' => 'ABAP', 'type' => 'technical'],
            ['name' => 'Basis', 'type' => 'technical'],
            ['name' => 'FIORI', 'type' => 'technical'],
            ['name' => 'Portal', 'type' => 'technical'],
            ['name' => 'PI/PO', 'type' => 'technical'],
            ['name' => 'BW/BI', 'type' => 'technical'],

            // Functional specialties
            ['name' => 'MM (Gestión de Materiales)', 'type' => 'functional'],
            ['name' => 'SD (Ventas y Distribución)', 'type' => 'functional'],
            ['name' => 'FI (Finanzas)', 'type' => 'functional'],
            ['name' => 'CO (Controlling)', 'type' => 'functional'],
            ['name' => 'PP (Planificación de Producción)', 'type' => 'functional'],
            ['name' => 'PM (Mantenimiento)', 'type' => 'functional'],
            ['name' => 'HCM (Recursos Humanos)', 'type' => 'functional'],
            ['name' => 'QM (Gestión de Calidad)', 'type' => 'functional'],
        ];

        foreach ($specialties as $specialty) {
            Specialty::create($specialty);
        }
    }
}
