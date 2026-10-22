# Security Specification - Sistem Pembayaran SPP Pondok Pesantren Salamatul Insan

## 1. Data Invariants
- Admin email `raida.zaujaty@gmail.com` is bootstrapped with root administrative privileges.
- Non-admin users cannot grant themselves or others the `admin` role.
- Bendahara can manage bills, process payments, and generate reports, but cannot alter `school_settings`, class configs, or user accounts.
- Payments cannot be silently deleted; transactions can only be marked as `Dibatalkan` with an audit reason and timestamp.
- Bills must belong to a valid student ID and maintain numeric integrity (`amount >= 0`, `paidAmount >= 0`, `remainingAmount >= 0`).

## 2. The "Dirty Dozen" Threat Vectors & Mitigations
1. **Self-Escalation**: Attacker attempts to write `role: "admin"` into `/users/{uid}`.
   - *Mitigation*: Blocked unless requester is already confirmed admin in Firestore or bootstrapped email.
2. **Settings Hijacking**: Bendahara attempts to update bank account numbers or default SPP nominal in `/school_settings/default`.
   - *Mitigation*: Only users with `role: "admin"` can update `school_settings`.
3. **Silent Payment Deletion**: User attempts `delete()` on `/payments/{id}` to erase proof of embezzlement.
   - *Mitigation*: `allow delete: if false;` for all clients.
4. **Negative Bill Amount**: Attacker sends negative billing amount or fake negative payment to decrease balance.
   - *Mitigation*: Enforce `amount > 0` and positive numbers in validation helpers.
5. **Orphan Bill Creation**: User creates a bill for non-existent student.
   - *Mitigation*: Enforce studentId format and check existence.
6. **Class Tampering**: Unauthorized creation of arbitrary classes without admin authorization.
   - *Mitigation*: Class writes restricted to `isAdmin()`.
7. **Unauthenticated Read**: Anonymous user attempts to read student phone numbers or payment history.
   - *Mitigation*: Root default-deny plus `isSignedIn()` requirement on all collections.
8. **Shadow Field Injection**: Injected fields in student or payment objects.
   - *Mitigation*: `hasOnly` and strict entity schema validation.
9. **Student Identity Tampering**: Modifying NIS or name to overwrite another student's balance.
   - *Mitigation*: Strict student update gates limited to admins.
10. **Spoofed Audit Trail**: Tampering with `cancelledAt` or removing cancel reasons.
    - *Mitigation*: Enforce non-empty cancelReason string on status cancellation.
11. **Denial of Wallet**: Attacker sends massive payloads (>128KB strings).
    - *Mitigation*: String `.size()` constraints on all inputs.
12. **Unauthorized Cross-Tenant Tampering**: Requests without valid auth context.
    - *Mitigation*: Default-deny catch-all rule `match /{document=**} { allow read, write: if false; }`.
