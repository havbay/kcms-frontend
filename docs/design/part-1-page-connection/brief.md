# Page Connection — Superseded Approval Draft

This earlier design proposed a second KCMS approval request after a Client had
already received workspace access. That boundary was removed by D-026.

The canonical Client flow is now:

```text
KCMS approves pilot access
        ↓
Client creates credentials and enters its workspace
        ↓
Continue with Facebook
        ↓
Meta authorization and Page selection
        ↓
Confirm and synchronize
```

`/app/connect` therefore presents Facebook authorization directly, with manual
Page-token connection as an advanced assisted path. Platform Operations reviews
initial pilot-access requests only; it has no separate Page-connections queue.
