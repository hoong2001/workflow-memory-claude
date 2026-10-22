# TF30063 — signing in to the TFVC server

`TF30063: You are not authorized to access ...` means the sign-in is missing or expired. It cannot
be fixed inside Claude's shell, nor through `!` in the prompt: neither is interactive, and
`/noprompt` suppresses the sign-in dialog.

Stop, and give the user this command (or run it on their go) — it opens a separate, interactive
window where the dialog can appear. `<collection>` is the `Collection:` line of `tf workfold .`:

```
PowerShell:  Start-Process powershell -ArgumentList '-NoExit','-Command','tf workspaces /collection:<collection>'
Bash:        cmd //c start "" powershell -NoExit -Command "tf workspaces /collection:<collection>"
```

The user signs in there and says so; then rerun the command that failed.

Never put a password or token in `/login:` — it lands in the shell history and the transcript.
