' Silent launcher for inbox-digest Robin-the-example-client cron.
' Invokes run-Robin-the-example-client.bat with window flag 0 (SW_HIDE).
' Mirror of example-client-hidden.vbs pattern.

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & "~/.claude\plugins\local\inbox-digest\cron\run-Robin-the-example-client.bat" & Chr(34), 0, False
Set WshShell = Nothing
