# Publica as janelas de hunt no GitHub, para o site do Vercel as ver.
#
# O Claude escreve data\celesta-hunts.json e public\celesta-hunts.json a cada
# ciclo (le a DM do bot Letter no Discord). Este script so trata do ultimo
# passo: empurrar para o repo. Corre de 5 em 5 minutos e sai em silencio
# quando nao ha nada a fazer.
#
# Duas licoes aprendidas a 26/08/2026, depois de este script ter estado
# horas sem publicar nada sem se queixar:
#
#  1. `git pull --rebase` recusa-se a correr se houver QUALQUER alteracao por
#     commitar na arvore -- mesmo em ficheiros que nao nos dizem respeito, como
#     src/ a meio de uma edicao. Dai o --autostash: guarda, rebase, repoe.
#  2. Nao basta olhar para o que ha para commitar. Se um push falhou antes, os
#     commits ficam parados localmente e nunca mais ha "nada de novo" para
#     disparar o envio. Por isso verificamos tambem se estamos a frente do
#     origin, e empurramos na mesma.

$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\Catarina\calculadora-tibia'
$log  = Join-Path $repo 'scripts\push-hunts.log'

function Write-Log($msg) {
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Add-Content -LiteralPath $log -Value "$stamp  $msg"
}

Set-Location -LiteralPath $repo

git add data/celesta-hunts.json public/celesta-hunts.json

# --quiet devolve 0 quando NAO ha nada em staging.
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m "chore: janelas de hunt livres do Celesta" | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Log 'commit falhou'; exit 1 }
}

# Ha commits nossos por enviar? (inclui os de corridas anteriores que falharam)
git fetch --quiet
$ahead = (git rev-list --count '@{u}..HEAD' 2>$null)
if ($LASTEXITCODE -ne 0) { Write-Log 'sem upstream configurado'; exit 1 }
if ([int]$ahead -eq 0) { exit 0 }

git pull --rebase --autostash | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Log "rebase falhou com $ahead commit(s) por enviar - abortado, resolver a mao"
  git rebase --abort
  exit 1
}

git push | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Log "push falhou com $ahead commit(s) pendentes"; exit 1 }

Write-Log "publicado ($ahead commit(s))"
