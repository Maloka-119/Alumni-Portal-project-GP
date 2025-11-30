# 🚀 دليل البدء السريع - Postman Testing

## 📥 خطوات الاستيراد

### 1. استيراد Collection
1. افتح Postman
2. اضغط على **Import** في الأعلى
3. اختر ملف `Alumni_Portal_Graduates.postman_collection.json`
4. اضغط **Import**

### 2. استيراد Environment
1. في Postman، اضغط على **Environments** في اليسار
2. اضغط على **Import**
3. اختر ملف `Alumni_Portal.postman_environment.json`
4. اضغط **Import**
5. تأكد من تفعيل Environment من القائمة المنسدلة في الأعلى

---

## ⚙️ الإعداد الأولي

### 1. تحديث المتغيرات
في Environment، قم بتحديث:
- `base_url`: `http://localhost:5005` (أو URL الـ server الخاص بك)
- `graduate_id`: `1` (أو أي ID خريج موجود في قاعدة البيانات)

### 2. الحصول على Token
1. افتح Request: **Authentication > Login**
2. عدّل الـ email والـ password في Body
3. اضغط **Send**
4. ✅ الـ token سيتم حفظه تلقائياً في Environment

---

## 🧪 ترتيب الاختبار

### الخطوة 1: Login
```
Authentication > Login
```
- ✅ بعد النجاح، الـ token سيتم حفظه تلقائياً

### الخطوة 2: اختبار Public Profile (New)
```
Public Profile (New Endpoint) > Get Public Graduate Profile
```
- ✅ تحقق من وجود: `fullName`, `faculty`, `department`, `graduationYear`, `image`

### الخطوة 3: اختبار Digital ID (Modified)
```
Digital ID (Modified Endpoint) > Get Digital ID
```
- ✅ تحقق من وجود: `nationalId`, `graduationId`, `qr` بالإضافة للبيانات الأساسية

### الخطوة 4: Generate QR Code
```
QR Code > Generate QR Code
```
- ✅ الـ QR token سيتم حفظه تلقائياً في Environment

### الخطوة 5: Verify QR Token
```
QR Code > Verify QR Token
```
- ✅ تحقق من وجود نفس البيانات + `nationalId`, `graduationId`, `qr`

---

## 📋 Checklist

قبل البدء، تأكد من:
- [ ] Backend Server يعمل على port 5005
- [ ] External API (graduateApi.js) يعمل على port 5001
- [ ] Environment variables محدثة
- [ ] Collection مستوردة
- [ ] Environment مفعل

---

## 🔍 التحقق من النتائج

### Public Profile يجب أن يحتوي على:
```json
{
  "fullName": "...",
  "faculty": "...",
  "department": "...",
  "graduationYear": 2022,
  "image": "https://..."
}
```

### Digital ID يجب أن يحتوي على:
```json
{
  "fullName": "...",
  "faculty": "...",
  "department": "...",
  "graduationYear": 2022,
  "personalPicture": "https://...",
  "nationalId": "30001011234567",  // ✅ جديد
  "graduationId": 1,                 // ✅ جديد
  "qr": "data:image/png;base64..." // ✅ جديد
}
```

---

## ❓ مشاكل شائعة

### ❌ "Error: getaddrinfo ENOTFOUND alumni-portal"
**المشكلة:** الـ URL ناقص الـ base URL

**الحل:**
1. تأكد من تفعيل Environment من القائمة المنسدلة في الأعلى (يجب أن يكون "Local" أو "Alumni Portal - Local")
2. استخدم الـ URL الكامل مع `{{base_url}}`:
   ```
   {{base_url}}/alumni-portal/graduates/1/public-profile
   ```
   أو مباشرة:
   ```
   http://localhost:5005/alumni-portal/graduates/1/public-profile
   ```
3. **لا تستخدم:** `alumni-portal/graduates/1/public-profile` ❌
4. **استخدم:** `{{base_url}}/alumni-portal/graduates/1/public-profile` ✅

**خطوات التحقق:**
- اضغط على القائمة المنسدلة بجانب "Save" في الأعلى
- تأكد من اختيار Environment (Local أو Alumni Portal - Local)
- تحقق من أن `base_url` موجود في Environment وقيمته `http://localhost:5005`

### "Not authorized"
- تأكد من تشغيل Login أولاً
- تحقق من أن الـ token موجود في Environment

### "External API is not running"
- تأكد من تشغيل `graduateApi.js` على port 5001
- تحقق من `GRADUATE_API_URL` في `.env`

### "Graduate not found"
- تأكد من أن `graduate_id` موجود في قاعدة البيانات
- جرب ID آخر

---

**ملاحظة:** جميع الـ requests في Collection تحتوي على scripts تلقائية لحفظ الـ tokens والمتغيرات! 🎉

