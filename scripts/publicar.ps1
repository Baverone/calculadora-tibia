# Commita o que o Claude escreveu na pasta.
#
# Existe porque a ponte remota escreve ficheiros mas nao corre comandos: de
# cada vez que muda alguma coisa na app, os ficheiros ficam na pasta por
# commitar. Isto e o passo que falta, numa linha:
#
#   powershell -ExecutionPolicy Bypass -File C:\Users\Catarina\calculadora-tibia\scripts\publicar.ps1 "grafico so com XP por dia"
#
# Commita E envia. A versao anterior so commitava e deixava o push-hunts.ps1
# enviar dentro de 5 minutos -- a ideia era haver um unico script a fazer push,
# para os dois nao se atropelarem. Na pratica isso queria dizer que "publicar"
# nao publicava nada durante cinco minutos, o que nao e o que a palavra quer
# dizer. O atropelo resolve-se como o push-hunts ja o resolvia: pull --rebase
# --autostash antes de empurrar, e se mesmo assim falhar, a corrida seguinte
# do push-hunts apanha o commit que ficou por enviar.
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
Write-Host 'A enviar...' -ForegroundColor Cyan

# --autostash porque o git recusa-se a fazer rebase com qualquer coisa por
# commitar na arvore, mesmo em ficheiros que nao nos dizem respeito.
git pull --rebase --autostash | Out-Null
if ($LASTEXITCODE -ne 0) {
  git rebase --abort
  Write-Host ''
  Write-Host 'O rebase falhou - o commit esta feito mas por enviar. Resolve a mao com git status.' -ForegroundColor Yellow
  exit 1
}

git push | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'O push falhou - o commit esta feito e o push-hunts.ps1 tenta outra vez dentro de 5 minutos.' -ForegroundColor Yellow
  exit 1
}

Write-Host ''
Write-Host 'Publicado no GitHub.' -ForegroundColor Green
Write-Host ''
