# ============================================================
# Script para levantar SmartWorkflow en modo desarrollo
# Uso: .\start-dev.ps1
# ============================================================

$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.10"

# Matar procesos java anteriores en los puertos 8080/8081
Write-Host "Verificando puertos..." -ForegroundColor Cyan
$ports = @(8080, 8081)
foreach ($port in $ports) {
    $netstatResult = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
    if ($netstatResult) {
        $pidNumber = ($netstatResult -split '\s+')[-1]
        Write-Host "Puerto $port ocupado por PID $pidNumber - Cerrando..." -ForegroundColor Yellow
        taskkill /PID $pidNumber /F 2>$null
        Start-Sleep -Seconds 1
    }
}

# Cargar variables desde .env
Write-Host "Cargando variables de entorno desde .env..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Get-Content ".env" | Where-Object { $_ -notmatch "^#" -and $_ -match "=" } | ForEach-Object {
        $parts = $_ -split "=", 2
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "  OK $key" -ForegroundColor Green
    }
} else {
    Write-Host "Archivo .env no encontrado. Crea uno basado en .env.example" -ForegroundColor Red
    exit 1
}

# Levantar Spring Boot
Write-Host ""
Write-Host "Iniciando SmartWorkflow en modo DEV (puerto 8081)..." -ForegroundColor Cyan
.\mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
