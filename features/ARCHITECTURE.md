# قاعدة بناء أي Feature

كل نطاق أعمال يعيش في `features/<feature>/` ولا يستورد Page من Feature آخر.

- `pages/`: تركيب صفحة المسار فقط.
- `components/`: عناصر العرض الخاصة بالنطاق.
- `api/`: Repository وDTO والتحويل بين API وDomain.
- `schemas/`: Zod validation الخاصة بالنطاق.
- `types/`: أنواع العرض أو الطلبات الخاصة بالنطاق.
- `hooks/`: جلب البيانات وحالة الصفحة لاحقاً.

الطبقات المشتركة فقط هي `components/shared` و`lib/api` و`types/domain.ts`. في الوقت الحالي تعمل Repositories على Mock Data؛ استبدالها بعميل HTTP لا يغير نماذج الواجهة.
