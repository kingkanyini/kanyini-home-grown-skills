' Silent launcher for inbox-digest jen-the-gut-center cron.
' Invokes run-jen-the-gut-center.bat with window flag 0 (SW_HIDE).
' Mirror of inbox-digest-hidden.vbs pattern.

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & "~/.claude\plugins\local\inbox-digest\cron\run-jen-the-gut-center.bat" & Chr(34), 0, False
Set WshShell = Nothing
