Option Explicit

Dim shell, fso, gameFolder, gameUrl

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
gameFolder = fso.GetParentFolderName(WScript.ScriptFullName)
gameUrl = "http://127.0.0.1:4173/"

' Start the local server hidden. If it already exists, the browser uses it.
shell.CurrentDirectory = gameFolder
shell.Run "py -3 -m http.server 4173 --bind 127.0.0.1", 0, False

WScript.Sleep 900
shell.Run gameUrl, 1, False
