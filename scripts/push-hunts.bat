@echo off
REM Publica as janelas de hunt no GitHub, para o site do Vercel as ver.
REM
REM O Claude escreve data\celesta-hunts.json e public\celesta-hunts.json de
REM hora a hora (le a DM do bot Letter no Discord). Este script so trata do
REM ultimo passo: empurrar para o repo. Se nada mudou, sai sem fazer commit,
REM por isso pode correr de hora a hora sem sujar o historico.

cd /d C:\Users\Catarina\calculadora-tibia || exit /b 1

git add data/celesta-hunts.json public/celesta-hunts.json

git diff --cached --quiet
if %errorlevel%==0 (
  echo Sem janelas novas para publicar.
  exit /b 0
)

git commit -m "chore: janelas de hunt livres do Celesta"
if %errorlevel% neq 0 exit /b 1

REM A Action do scraper de XP tambem faz commits; trazer o que la esta
REM primeiro evita o "fetch first". Toca em ficheiros diferentes, nao choca.
git pull --rebase
if %errorlevel% neq 0 (
  echo Rebase falhou - resolver a mao.
  git rebase --abort
  exit /b 1
)

git push
