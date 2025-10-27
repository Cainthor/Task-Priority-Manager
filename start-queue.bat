@echo off
echo ==================================
echo  Task Priority Manager - Queue Worker
echo ==================================
echo.
echo Procesando colas de correos...
echo Presiona Ctrl+C para detener
echo.

cd /d "%~dp0"
php artisan queue:work --tries=3 --timeout=90
