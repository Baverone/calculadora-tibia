# Regista (ou atualiza) a tarefa do Agendador que corre run-celesta-local.ps1.
# Correr uma vez, num PowerShell normal do utilizador (nao precisa de admin):
#
#   powershell -ExecutionPolicy Bypass -File scripts\celesta\instalar-tarefa.ps1
#
# Horario: de hora a hora das 08:03 as 23:03 e uma vez as 00:03, hora local
# do PC -- o mesmo que a tarefa da nuvem fazia. O :03 e para nao bater com o
# scrape-xp (:15) e cair antes do push-hunts (:06/:11), que envia o ficheiro.
#
# Tem de correr na sessao interativa do utilizador (LogonType Interactive):
# o Claude fala com o Chrome pela extensao, e isso so existe com o utilizador
# com sessao iniciada. Se o PC estiver bloqueado a sessao continua la; se
# ninguem tiver sessao iniciada a tarefa nao corre e o Agendador diz porque.
#
# Para remover: Unregister-ScheduledTask -TaskName 'Celesta - spots livres (Claude local)' -Confirm:$false

$nome   = 'Celesta - spots livres (Claude local)'
$repo   = 'C:\Users\Catarina\calculadora-tibia'
$script = Join-Path $repo 'scripts\celesta\run-celesta-local.ps1'

if (-not (Test-Path -LiteralPath $script)) { Write-Error "nao encontro $script"; exit 1 }

$accao = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`"" `
  -WorkingDirectory $repo

# 08:03, repetido de hora a hora durante 15h30 -> ultima as 23:03.
$dia = New-ScheduledTaskTrigger -Daily -At '08:03'
$rep = New-ScheduledTaskTrigger -Once -At '08:03' `
  -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Hours 15 -Minutes 30)
$dia.Repetition = $rep.Repetition
$meiaNoite = New-ScheduledTaskTrigger -Daily -At '00:03'

$defs = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 25) `
  -MultipleInstances IgnoreNew `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -RunOnlyIfNetworkAvailable

$quem = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $nome -Action $accao -Trigger @($dia, $meiaNoite) `
  -Settings $defs -Principal $quem -Force | Out-Null

$t = Get-ScheduledTask -TaskName $nome
$info = $t | Get-ScheduledTaskInfo
Write-Host "Tarefa '$nome': $($t.State). Proxima corrida: $($info.NextRunTime)"
Write-Host "Para correr ja: Start-ScheduledTask -TaskName '$nome'"
