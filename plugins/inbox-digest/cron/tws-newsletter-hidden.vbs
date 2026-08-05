' Silent launcher for inbox-digest cron (tws-newsletter).
' Invokes run-tws.bat with window flag 0 (SW_HIDE) so nothing appears on screen.
' Mirror of inbox-digest-hidden.vbs (<example-client>).

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & "~/.claude\plugins\local\inbox-digest\cron\run-tws.bat" & Chr(34), 0, False
Set WshShell = Nothing
