<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Holiday;
use Illuminate\Support\Facades\Http;

class SyncHolidays extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'holidays:sync {year?} {country=CL}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza feriados desde la API de Nager.Date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $year = $this->argument('year') ?? date('Y');
        $country = $this->argument('country');

        $this->info("Sincronizando feriados de {$country} para el año {$year}...");

        try {
            // API: https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}
            $response = Http::withoutVerifying()->get("https://date.nager.at/api/v3/PublicHolidays/{$year}/{$country}");

            if (!$response->successful()) {
                $this->error('Error al obtener feriados de la API');
                return 1;
            }

            $holidays = $response->json();
            $created = 0;
            $skipped = 0;

            foreach ($holidays as $holiday) {
                $exists = Holiday::where('date', $holiday['date'])->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                Holiday::create([
                    'date' => $holiday['date'],
                    'name' => $holiday['localName'] ?? $holiday['name'],
                    'description' => $holiday['name'],
                    'is_recurring' => true, // Los feriados nacionales suelen repetirse
                ]);

                $created++;
            }

            $this->info("✓ {$created} feriados creados");
            $this->info("- {$skipped} feriados ya existían");

            return 0;
        } catch (\Exception $e) {
            $this->error("Error: {$e->getMessage()}");
            return 1;
        }
    }
}
