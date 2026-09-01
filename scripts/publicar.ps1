# Commita o que o Claude escreveu na pasta.
#
# Existe porque a ponte remota escreve ficheiros mas nao corre comandos: de
# cada vez que muda alguma coisa na app, os ficheiros ficam na pasta por
# commitar. Isto e o passo que falta, numa linha:
#
#   powershell -ExecutionPolicy Bypass -File C:\Users\Catarina\calculadora-tibia\scripts\publicar.ps1 "grafico so com XP por dia"
#
# Nao faz push, de proposito. O push-hunts.ps1 ja corre de 5 em 5 minutos, ja
# verifica se ha commits por enviar, e e o unico que faz push -- dois scripts
# a empurrar para o mesmo sitio e como se arranjam conflitos a meio da noite.
#
# Gravado em UTF-8 com BOM: o Windows PowerShell 5.1 le um .ps1 sem BOM como
# ANSI, e a mensagem de commit que passares pode ter acentos.

param(
  [Parameter(Position = 0)]
  [string]$Mensagem = 'Atualizacoes da app'
)

$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\Catarina\calculadora-tibia'
Set-Location -LiteralPath $repo

git add -A

# --quiet devolve 0 quando NAO ha nada em staging.
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host 'Nada mudou - nao ha o que commitar.' -ForegroundColor Yellow
  exit 0
}

Write-Host ''
Write-Host 'A commitar:' -ForegroundColor Cyan
git diff --cached --stat

git commit -m $Mensagem | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'O commit falhou - ve o que diz o git status.' -ForegroundColor Yellow
  exit 1
}

Write-Host ''
Write-Host 'Commit feito. O push-hunts.ps1 envia-o dentro de 5 minutos.' -ForegroundColor Green
Write-Host ''
