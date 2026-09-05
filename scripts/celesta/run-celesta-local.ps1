# Janelas livres do Celesta -- a correr AQUI, no PC, com o Claude Code.
#
# Ate 5/09/2026 esta rotina corria como tarefa agendada na nuvem do Claude,
# que se ligava ao Chrome deste PC pela extensao. Dava "sucesso" em 25 s
# quando nao encontrava o Chrome e ninguem dava por nada: o ficheiro ficou
# parado de 3/09 a 5/09 com a tarefa verde. Agora corre do proprio PC: o
# Agendador de Tarefas lanca este script, que entrega o prompt ao Claude Code
# (claude.exe, modo -p, sem interacao) com acesso ao Chrome local.
#
# O que o Claude faz esta todo em prompt-local.md (ler o Discord, correr o
# escrever-hunts.mjs). Este script so trata do resto:
#   - encontrar o claude.exe e o node (o Agendador nao herda o PATH);
#   - nao deixar duas corridas sobrepostas;
#   - registar cada corrida em scripts\celesta\runs.jsonl (uma linha JSON por
#     corrida: estado, duracao, custo, turnos) e em scripts\celesta-local.log
#     (uma linha legivel). E isto que a revisao semanal le para perceber o
#     que anda a falhar;
#   - confirmar que o data\celesta-hunts.json foi mesmo reescrito -- a licao
#     do push-hunts e do scrape-xp: "correu" nao quer dizer "fez".
#
# Nao faz commit nem push: o push-hunts.ps1 (5 em 5 min) apanha o ficheiro.
#
# Correr a mao, para testar:
#   powershell -ExecutionPolicy Bypass -File scripts\celesta\run-celesta-local.ps1
# Instalar a tarefa agendada (uma vez): scripts\celesta\instalar-tarefa.ps1

$ErrorActionPreference = 'Continue'
$repo   = 'C:\Users\Catarina\calculadora-tibia'
$log    = Join-Path $repo 'scripts\celesta-local.log'
$runs   = Join-Path $repo 'scripts\celesta\runs.jsonl'
$prompt = Join-Path $repo 'scripts\celesta\prompt-local.md'
$tmp    = Join-Path $repo 'scripts\celesta\tmp'
$lock   = Join-Path $tmp 'a-correr.lock'
$saida  = Join-Path $repo 'data\celesta-hunts.json'

# Modelo: a rotina e passo-a-passo e bem descrita, o sonnet chega e gasta
# muito menos do limite da subscricao (corre 17x por dia). Se a revisao
# semanal mostrar falhas de extracao repetidas, subir para 'opus'.
$modelo     = 'sonnet'
$maxTurnos  = 80
$timeoutMin = 20   # tambem esta no Agendador (ExecutionTimeLimit)

function Write-Log($msg) {
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Add-Content -LiteralPath $log -Value "$stamp  $msg"
  Write-Host "$stamp  $msg"
}

function Registar($estado, $motivo, $inicio, $j, $codigo, $atualizado) {
  $linha = [ordered]@{
    ts          = (Get-Date -Format 'o')
    estado      = $estado
    motivo      = $motivo
    duracao_s   = [int]((Get-Date) - $inicio).TotalSeconds
    codigo      = $codigo
    atualizado  = $atualizado
    modelo      = $modelo
    turnos      = $(if ($j -and $j.PSObject.Properties['num_turns']) { $j.num_turns } else { $null })
    custo_usd   = $(if ($j -and $j.PSObject.Properties['total_cost_usd']) { [math]::Round([double]$j.total_cost_usd, 4) } else { $null })
    sessao      = $(if ($j -and $j.PSObject.Properties['session_id']) { $j.session_id } else { $null })
  }
  # UTF-8 sem BOM: o Add-Content -Encoding UTF8 do PowerShell 5 mete BOM e
  # estraga a primeira linha para quem ler o ficheiro como JSON Lines.
  [IO.File]::AppendAllText($runs, (ConvertTo-Json $linha -Compress) + "`n", [Text.UTF8Encoding]::new($false))
}

Set-Location -LiteralPath $repo
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

# Uma corrida de cada vez. O lock fica para tras se o processo for morto,
# por isso um lock com mais de $timeoutMin minutos conta como lixo.
if (Test-Path -LiteralPath $lock) {
  $idade = (Get-Date) - (Get-Item -LiteralPath $lock).LastWriteTime
  if ($idade.TotalMinutes -lt $timeoutMin) { Write-Log 'a anterior ainda esta a correr - esta corrida foi saltada'; exit 0 }
}
Set-Content -LiteralPath $lock -Value (Get-Date -Format 'o')

try {
  # claude.exe: o instalador oficial poe-o em %USERPROFILE%\.local\bin.
  $claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
  if (-not $claude) {
    foreach ($c in @("$env:USERPROFILE\.local\bin\claude.exe", "$env:LOCALAPPDATA\Programs\claude\claude.exe")) {
      if (Test-Path -LiteralPath $c) { $claude = $c; break }
    }
  }
  if (-not $claude) {
    Write-Log 'claude.exe nao encontrado - instalar com: irm https://claude.ai/install.ps1 | iex'
    Registar 'FALHA' 'claude.exe nao encontrado' (Get-Date) $null $null $false
    exit 1
  }

  # node: o Claude vai chamar "node scripts\celesta\escrever-hunts.mjs" na
  # shell dele, que herda o PATH deste processo -- garantir que la esta.
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    foreach ($d in @("$env:ProgramFiles\nodejs", "${env:ProgramFiles(x86)}\nodejs", "$env:LOCALAPPDATA\nodejs")) {
      if (Test-Path -LiteralPath "$d\node.exe") { $env:PATH = "$d;$env:PATH"; break }
    }
  }
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Log 'node.exe nao encontrado - a rotina nao correu'
    Registar 'FALHA' 'node.exe nao encontrado' (Get-Date) $null $null $false
    exit 1
  }

  $antes  = if (Test-Path -LiteralPath $saida) { (Get-Item -LiteralPath $saida).LastWriteTimeUtc } else { [datetime]::MinValue }
  $inicio = Get-Date

  # O prompt vai pelo stdin; tudo em UTF-8 para os acentos chegarem inteiros.
  [Console]::OutputEncoding = [Text.Encoding]::UTF8
  $OutputEncoding = [Text.Encoding]::UTF8
  $texto = Get-Content -LiteralPath $prompt -Raw -Encoding UTF8

  # Permissoes: so o Chrome (extensao), ler/escrever ficheiros e "node ...".
  # Tudo o resto e recusado em vez de ficar a espera de uma resposta que
  # nunca vem (modo dontAsk). Se o Discord tentar meter um comando pelo
  # meio, nao ha Bash generico para o correr.
  $permitidas = 'mcp__claude-in-chrome__*,Read,Write,Edit,Bash(node *),Bash(node.exe *)'
  $argumentos = @(
    '-p',
    '--chrome',
    '--model', $modelo,
    '--max-turns', "$maxTurnos",
    '--output-format', 'json',
    '--permission-mode', 'dontAsk',
    '--allowedTools', $permitidas
  )

  $errFile = Join-Path $tmp 'ultimo-stderr.txt'
  $outFile = Join-Path $tmp 'ultima-saida.json'
  Write-Host "a correr: $claude $($argumentos -join ' ')"
  $bruto = ($texto | & $claude @argumentos 2>$errFile) -join "`n"
  $codigo = $LASTEXITCODE
  Set-Content -LiteralPath $outFile -Value $bruto -Encoding UTF8

  $j = $null
  try { $j = $bruto | ConvertFrom-Json } catch { $j = $null }
  # A saida em modo json e um objeto so; se vier uma lista, fica o ultimo.
  if ($j -is [array]) { $j = $j[-1] }

  $resultado = ''
  if ($j -and $j.PSObject.Properties['result'] -and $j.result) {
    $resultado = [string]$j.result
  } elseif (-not $j) {
    $resultado = $bruto
  }
  $ultima = ''
  if ($resultado -match 'RESULTADO:\s*(OK|FALHA)\s*(.*)') {
    $ultima = ($Matches[1] + ' ' + $Matches[2]).Trim()
  }

  $depois     = if (Test-Path -LiteralPath $saida) { (Get-Item -LiteralPath $saida).LastWriteTimeUtc } else { [datetime]::MinValue }
  $atualizado = $depois -gt $antes
  $isError    = $j -and $j.PSObject.Properties['is_error'] -and $j.is_error

  if ($codigo -eq 0 -and -not $isError -and $ultima -like 'OK*' -and $atualizado) {
    $estado = 'OK'; $motivo = $ultima.Substring(2).Trim()
  } elseif ($ultima -like 'FALHA*') {
    $estado = 'FALHA'; $motivo = $ultima.Substring(5).Trim()
  } elseif ($codigo -ne 0 -or $isError) {
    $erro = if (Test-Path -LiteralPath $errFile) { (Get-Content -LiteralPath $errFile | Select-Object -Last 1) } else { '' }
    $estado = 'FALHA'; $motivo = "claude saiu com codigo $codigo $erro".Trim()
    if ($resultado) { $motivo += ' | ' + ($resultado -split "`n" | Select-Object -Last 1) }
  } elseif (-not $ultima) {
    $estado = 'FALHA'; $motivo = 'sem linha RESULTADO na resposta (max-turns?) | ' + ($resultado -split "`n" | Select-Object -Last 1)
  } else {
    $estado = 'FALHA'; $motivo = 'disse OK mas o data\celesta-hunts.json nao mudou'
  }

  $dur   = [int]((Get-Date) - $inicio).TotalSeconds
  $custo = if ($j -and $j.PSObject.Properties['total_cost_usd']) { ' custo ' + [math]::Round([double]$j.total_cost_usd, 3) + ' USD' } else { '' }
  Write-Log "$estado  $motivo  (${dur}s$custo)"
  Registar $estado $motivo $inicio $j $codigo $atualizado

  if ($estado -eq 'OK') { exit 0 } else { exit 1 }
}
finally {
  Remove-Item -LiteralPath $lock -ErrorAction SilentlyContinue
}
