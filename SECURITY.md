# Security Policy

## Reporting a vulnerability

Do not open a public issue. Use GitHub's private vulnerability reporting ("Report a vulnerability" in the Security tab) so maintainers can fix the problem before it is disclosed.

Please include what you found, how to reproduce it, and its possible impact. You will get an acknowledgement within 7 days.

## Scope

Telko is a static website with no server and no user accounts. The most sensitive area is **USSD codes that move money**: a wrong code in the dataset can send money to the wrong person. Report any such error as a security issue, not as a regular data fix.

Telko never asks for, stores or transmits a mobile money PIN. Codes that need one are dialed up to the PIN and closed with `#`, so the operator's own menu asks for it. Any code path that could expose a PIN is a vulnerability.

Data kept on the device only (IndexedDB), never sent anywhere: the last five recipient numbers typed in the code assistant (removable from Settings) and which codes are used and how often (code ids only). Amounts and secret codes are never kept. See `docs/offline.md`.
