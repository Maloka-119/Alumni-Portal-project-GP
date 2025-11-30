# 🔧 حل مشكلة: Error: getaddrinfo ENOTFOUND alumni-portal

## المشكلة
عند محاولة إرسال request في Postman، تظهر رسالة الخطأ:
```
Error: getaddrinfo ENOTFOUND alumni-portal
```

## السبب
الـ URL المستخدم **ناقص الـ base URL**. Postman يحاول البحث عن hostname اسمه `alumni-portal` بدلاً من `localhost:5005`.

## ✅ الحلول

### الحل 1: استخدام Environment Variable (مُوصى به)

1. **تأكد من تفعيل Environment:**
   - في Postman، انظر للقائمة المنسدلة بجانب "Save" في الأعلى
   - يجب أن يكون Environment مفعل (مثل "Local" أو "Alumni Portal - Local")
   - إذا لم يكن مفعل، اختره من القائمة

2. **استخدم `{{base_url}}` في الـ URL:**
   ```
   {{base_url}}/alumni-portal/graduates/1/public-profile
   ```
   
   سيتم استبدال `{{base_url}}` تلقائياً بـ `http://localhost:5005`

3. **تحقق من قيمة `base_url` في Environment:**
   - اضغط على أيقونة "Environments" في اليسار
   - اختر Environment الخاص بك
   - تأكد من أن `base_url` = `http://localhost:5005`

---

### الحل 2: استخدام الـ URL الكامل مباشرة

بدلاً من استخدام Environment variable، اكتب الـ URL الكامل:

```
http://localhost:5005/alumni-portal/graduates/1/public-profile
```

---

### الحل 3: إضافة base URL يدوياً في Postman

1. في Postman، اضغط على **Environments** في اليسار
2. اختر Environment (أو أنشئ واحد جديد)
3. أضف متغير جديد:
   - **Key:** `base_url`
   - **Value:** `http://localhost:5005`
   - **Type:** default
4. احفظ التغييرات
5. فعّل Environment من القائمة المنسدلة
6. استخدم `{{base_url}}` في الـ URL

---

## 📝 أمثلة صحيحة وخاطئة

### ❌ خطأ:
```
alumni-portal/graduates/1/public-profile
```
**النتيجة:** `Error: getaddrinfo ENOTFOUND alumni-portal`

### ✅ صحيح (مع Environment):
```
{{base_url}}/alumni-portal/graduates/1/public-profile
```
**النتيجة:** `http://localhost:5005/alumni-portal/graduates/1/public-profile`

### ✅ صحيح (مباشر):
```
http://localhost:5005/alumni-portal/graduates/1/public-profile
```

---

## 🔍 خطوات التحقق السريعة

1. ✅ Environment مفعل؟ (القائمة المنسدلة في الأعلى)
2. ✅ `base_url` موجود في Environment؟
3. ✅ قيمة `base_url` = `http://localhost:5005`؟
4. ✅ الـ URL يبدأ بـ `{{base_url}}` أو `http://localhost:5005`؟

---

## 🎯 مثال كامل

**في Postman Request:**

**Method:** `GET`

**URL:**
```
{{base_url}}/alumni-portal/graduates/1/public-profile
```

**Headers:**
```
Content-Type: application/json
Accept-Language: ar
```

**عند الإرسال، سيصبح الـ URL:**
```
http://localhost:5005/alumni-portal/graduates/1/public-profile
```

---

## 💡 نصيحة

استخدم الـ Collection الجاهزة (`Alumni_Portal_Graduates.postman_collection.json`) لأنها:
- ✅ تحتوي على جميع الـ URLs الصحيحة
- ✅ تستخدم Environment variables تلقائياً
- ✅ جاهزة للاستخدام مباشرة

---

**إذا استمرت المشكلة:**
1. تأكد من أن Backend Server يعمل على port 5005
2. جرب الـ URL مباشرة في المتصفح: `http://localhost:5005/alumni-portal/graduates/1/public-profile`
3. تحقق من أن لا يوجد firewall يمنع الاتصال

