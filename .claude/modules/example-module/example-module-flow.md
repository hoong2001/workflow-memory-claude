# Example Module — Flow (handover map)

> **Purpose: a handover document.** Orient anyone taking over this module (future-you or Claude).
> Captures how the module works NOW: its flow, the files/methods it calls, with short notes.
> **NOT a changelog** — change history lives in `impl/`, plans in `plans/`.
>
> Keep it current when the module's structure changes. You can seed/refresh it with
> `/wp-module-code-trace-flow`, but keep only the stable "how it works" parts — a specific change's
> "where to cut" belongs in that change's plan (`plans/`), not here.

## Flow
(The main path, end to end — how a request / operation travels through this module.)

## Called files & methods
| File | Method | Role (short) |
|---|---|---|
| (e.g., any stack) order repository file | `getById` | reads one order from the DB |
| | | |

## Shared symbols & their callers (fan-in)
(Symbols reused beyond the main path — base classes, shared constants/enums, reused result
objects, or anything a grep shows with more than one caller. The blast-radius map: who else
inherits an edit to this symbol. Filled by `/wp-module-code-trace-flow` Step 3.5.)

| Shared symbol | Callers (`file:method`) | Entry points |
|---|---|---|
| (e.g., any stack) base repository column builder | `orderRepo:insert`, `stockRepo:insert` | Web, Backend |
| | | |

## Notes
(Brief — only what genuinely helps someone pick this module up.)
