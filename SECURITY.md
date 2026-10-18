# Security Policy

## Reporting a vulnerability

Do not open a public issue. Use GitHub's private vulnerability reporting ("Report a vulnerability" in the Security tab) so maintainers can fix the problem before it is disclosed.

Please include what you found, how to reproduce it, and its possible impact. You will get an acknowledgement within 7 days.

## Scope

Telko is a static website with no server and no user accounts. The most sensitive area is **USSD codes that move money**: a wrong code in the dataset can send money to the wrong person. Report any such error as a security issue, not as a regular data fix.

Telko never asks for, stores or transmits a mobile money PIN. Any code path that could expose one is a vulnerability.
