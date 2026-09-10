# خريطة API المقترحة للـBackend

كل Endpoint يعيد `{ data, meta? }`، وقوائم الموارد تدعم `page`, `perPage`, `search`, `sort`, `direction`, و`status`.

| المورد | Endpoint | عمليات خاصة |
|---|---|---|
| Owner | `/owners` | archive, activate |
| ManagementContract | `/management-contracts` | renew |
| Property / Unit | `/properties`, `/units` | property units |
| Tenant / Lease | `/tenants`, `/leases` | generate-installments |
| Receivable | `/receivables` | reminder, demand-letter |
| Payment | `/payments` | `POST /payments/{id}/reverse` مع `reversalReason` |
| Expense | `/expenses` | attachment |
| Maintenance | `/maintenance-requests` | approve/reject |
| OwnerSettlement | `/owner-settlements` | `POST /{id}/transfers` |
| Document | `/documents` | upload, generate, export |

## حدود الطبقات

`app/` يحدد المسارات فقط. `features/` يحتوي صفحة المجال وسلوكه. `lib/api/` هو عميل HTTP وعقود الطلب/الاستجابة. `mocks/` مصدر مؤقت فقط. لا يقرأ أي Component بيانات Backend مباشرة.
