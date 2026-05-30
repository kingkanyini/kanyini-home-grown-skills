' Silent launcher for inbox-digest cron.
' Invokes run-example.bat with window flag 0 (SW_HIDE) so nothing appears on screen.
' Mirror of plugins/local/task-manager/start-hidden.vbs pattern.

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & "~/.claude\plugins\local\inbox-digest\cron\run-example.bat" & Chr(34), 0, False
Set WshShell = Nothing
