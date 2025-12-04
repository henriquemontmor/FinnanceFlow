# Verificacao de Seguranca - FinnanceFlow
Write-Host ""
Write-Host "=== VERIFICACAO DE SEGURANCA ===" -ForegroundColor Cyan
Write-Host ""

$erros = 0

# Verificar config.js
if (Test-Path "js\config.js") {
    $status = git status --porcelain js/config.js 2>$null
    if ($status) {
        Write-Host "[X] js/config.js ERRO: esta sendo rastreado!" -ForegroundColor Red
        $erros++
    } else {
        Write-Host "[OK] js/config.js (gitignored)" -ForegroundColor Green
    }
}

# Verificar Code.gs
if (Test-Path "appscript\Code.gs") {
    $status = git status --porcelain appscript/Code.gs 2>$null
    if ($status) {
        Write-Host "[X] appscript/Code.gs ERRO: esta sendo rastreado!" -ForegroundColor Red
        $erros++
    } else {
        Write-Host "[OK] appscript/Code.gs (gitignored)" -ForegroundColor Green
    }
}

# Verificar templates
if (Test-Path "js\config.js.template") {
    Write-Host "[OK] js/config.js.template existe" -ForegroundColor Green
} else {
    Write-Host "[X] js/config.js.template NAO ENCONTRADO!" -ForegroundColor Red
    $erros++
}

if (Test-Path "appscript\Code.gs.template") {
    Write-Host "[OK] appscript/Code.gs.template existe" -ForegroundColor Green
} else {
    Write-Host "[X] appscript/Code.gs.template NAO ENCONTRADO!" -ForegroundColor Red
    $erros++
}

if (Test-Path ".github\workflows\deploy.yml") {
    Write-Host "[OK] GitHub Actions configurado" -ForegroundColor Green
} else {
    Write-Host "[!] GitHub Actions nao configurado" -ForegroundColor Yellow
}

Write-Host ""
if ($erros -eq 0) {
    Write-Host ">>> SEGURO PARA COMMIT! <<<" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:"
    Write-Host "1. git add ."
    Write-Host "2. git commit -m 'Initial commit'"
    Write-Host "3. git push"
    Write-Host ""
    Write-Host "Configure o Secret no GitHub: APPS_SCRIPT_URL" -ForegroundColor Yellow
} else {
    Write-Host ">>> NAO FACA COMMIT! $erros erro(s) encontrado(s) <<<" -ForegroundColor Red
}
Write-Host ""
