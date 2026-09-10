# عقد بيانات الواجهة الأمامية

تستخدم الواجهة أسماء خصائص إنجليزية بصيغة camelCase، والعربية للعرض فقط.

| الكيان | الحقول الأساسية | العلاقات |
|---|---|---|
| Owner | id, ownerCode, fullName, nationalIdOrIqama, mobilePrimary, bankAccount, status | يمتلك Properties وManagementContracts وOwnerSettlements |
| Property | id, propertyCode, propertyName, ownerId, propertyType, unitsCount | يتبع Owner ويحتوي PropertyUnit |
| PropertyUnit | id, unitCode, propertyId, expectedAnnualRent, status | يتبع Property وله LeaseContracts |
| Tenant | id, tenantCode, fullName, mobilePrimary, status | له LeaseContracts تاريخية |
| LeaseContract | id, internalContractNumber, tenantId, propertyId, unitId, totalContractValue, installments | يولد Receivables |
| Receivable | id, leaseId, tenantId, propertyId, unitId, originalAmount, paidAmount, remainingAmount | يستقبل Payments |
| Payment | id, paymentNumber, receivableId, amount, paymentDate, status | يتبع Receivable؛ لا يحذف عند الإلغاء |
| Expense | id, propertyId, description, amount, expenseDate | قد يتحمله المالك في التسوية |
| ManagementContract | id, contractNumber, ownerId, managementFeePercentage | يتبع Owner |
| OwnerSettlement | id, settlementNumber, ownerId, grossCollections, managementFees, ownerChargeableExpenses, netDueToOwner, transferAmount, remainingBalance | يحوي OwnerTransfers |

تُستخدم المخططات في `schemas/index.ts` للتحقق من النماذج، وتُعرض هذه الكيانات في الجداول والنماذج التفصيلية المقابلة.
