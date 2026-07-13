# Example Module — Flow (handover map)

> **Purpose: a handover document.** Orient anyone taking over this module (future-you or Claude).
> Captures how the module works NOW: its flow, the files/methods it calls, with short notes.
> **NOT a changelog** — change history lives in `impl/`, plans in `plans/`.
>
> Keep it current when the module's structure changes. You can seed/refresh it with
> `/workspace-code-trace-spec`, but keep only the stable "how it works" parts — a specific change's
> "where to cut" belongs in that change's plan (`plans/`), not here.

## Flow
(The main path, end to end — how a request / operation travels through this module.)

## Called files & methods
| File | Method | Role (short) |
|---|---|---|
| (e.g.) OrderRepository.cs | `GetById` | reads one order via Dapper |
| | | |

## Notes
(Brief — only what genuinely helps someone pick this module up.)
