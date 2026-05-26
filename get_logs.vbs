Set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c ""title GET_LOGS && echo Obteniendo logs remotos... && ssh root@142.93.186.75 'pm2 logs aliado-api --err --lines 50 --nostream' > C:\dev\aliado-laboral\do_logs.txt""", 1
WScript.Sleep 3500
WshShell.AppActivate "GET_LOGS"
WScript.Sleep 500
WshShell.SendKeys "yA7{%}pA1{{}vD7_rR2R{ENTER}"
