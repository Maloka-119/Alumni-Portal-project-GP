# دليل اختبار Endpoints الخريجين على Postman

## 📋 المتطلبات الأساسية

1. **تأكد من تشغيل:**
   - Backend Server على `http://localhost:5005`
   - External API (graduateApi.js) على `http://localhost:5001`

2. **متغيرات البيئة المطلوبة:**
   - `GRADUATE_API_URL=http://localhost:5001/api/graduate`
   - `BACKEND_URL=http://localhost:5005` (اختياري)

---

## 🔐 1. الحصول على Token للمصادقة

### Endpoint: Login
```
POST http://localhost:5005/alumni-portal/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**💡 احفظ الـ token لاستخدامه في الـ endpoints المحمية**

---

## 🆕 2. اختبار Endpoint الجديد: Public Profile

### Endpoint: Get Public Graduate Profile
```
GET http://localhost:5005/alumni-portal/graduates/:id/public-profile
```

**مثال:**
```
GET http://localhost:5005/alumni-portal/graduates/1/public-profile
```

**Headers:**
```
Content-Type: application/json
Accept-Language: ar (أو en)
```

**⚠️ ملاحظة:** هذا endpoint **PUBLIC** - لا يحتاج authentication

**Response المتوقع (Success - 200):**
```json
{
  "status": "success",
  "message": "Public graduate profile fetched successfully",
  "data": {
    "fullName": "أحمد محمد",
    "faculty": "كلية الهندسة بحلوان",
    "department": "Computer Science",
    "graduationYear": 2022,
    "image": "https://res.cloudinary.com/.../profile.jpg"
  }
}
```

**Response في حالة الخطأ (404):**
```json
{
  "status": "fail",
  "message": "Graduate not found",
  "data": null
}
```

**Response في حالة فشل External API (500):**
```json
{
  "status": "error",
  "message": "Failed to fetch student data from external system",
  "data": null,
  "errorCode": "EXTERNAL_API_ERROR"
}
```

---

## 🔄 3. اختبار Endpoint القديم المعدل: Digital ID

### Endpoint: Get Digital ID (Protected)
```
GET http://localhost:5005/alumni-portal/graduates/digital-id
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
Accept-Language: ar (أو en)
```

**⚠️ ملاحظة:** هذا endpoint **PROTECTED** - يحتاج authentication token

**Response المتوقع (Success - 200):**
```json
{
  "status": "success",
  "message": "Graduate Digital ID fetched successfully",
  "data": {
    "personalPicture": "https://res.cloudinary.com/.../profile.jpg",
    "fullName": "أحمد محمد",
    "faculty": "كلية الهندسة بحلوان",
    "department": "Computer Science",
    "graduationYear": 2022,
    "status": "active",
    "nationalId": "30001011234567",
    "graduationId": 1,
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**Response في حالة عدم المصادقة (401):**
```json
{
  "status": "fail",
  "message": "Not authorized or user not found",
  "data": null
}
```

---

## 🔍 4. اختبار Endpoint: Verify Digital ID QR

### Endpoint: Verify QR Token
```
GET http://localhost:5005/alumni-portal/graduates/digital-id/verify/:token
```

**مثال:**
```
GET http://localhost:5005/alumni-portal/graduates/digital-id/verify/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Headers:**
```
Content-Type: application/json
Accept-Language: ar (أو en)
```

**⚠️ ملاحظة:** هذا endpoint **PUBLIC** - لا يحتاج authentication

**Response المتوقع (Success - 200):**
```json
{
  "status": "success",
  "message": "Digital ID verified successfully",
  "data": {
    "personalPicture": "https://res.cloudinary.com/.../profile.jpg",
    "fullName": "أحمد محمد",
    "faculty": "كلية الهندسة بحلوان",
    "department": "Computer Science",
    "graduationYear": 2022,
    "status": "active",
    "nationalId": "30001011234567",
    "graduationId": 1,
    "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**Response في حالة Token غير صالح (401):**
```json
{
  "status": "fail",
  "message": "Invalid or expired token",
  "data": null
}
```

---

## 📝 خطوات الاختبار في Postman

### الخطوة 1: إعداد Environment Variables (اختياري لكن مفيد)

1. في Postman، اضغط على **Environments** في اليسار
2. أنشئ Environment جديد باسم "Alumni Portal"
3. أضف المتغيرات التالية:
   - `base_url` = `http://localhost:5005`
   - `token` = (سيتم ملؤه بعد Login)
   - `graduate_id` = `1` (أو أي ID موجود)

### الخطوة 2: اختبار Login

1. أنشئ Request جديد:
   - Method: **POST**
   - URL: `{{base_url}}/alumni-portal/login`
2. في **Headers**:
   - `Content-Type: application/json`
3. في **Body** (اختر raw JSON):
   ```json
   {
     "email": "user@example.com",
     "password": "yourpassword"
   }
   ```
4. اضغط **Send**
5. من الـ Response، انسخ الـ `token` واحفظه في متغير `token`

### الخطوة 3: اختبار Public Profile (New Endpoint)

1. أنشئ Request جديد:
   - Method: **GET**
   - URL: `{{base_url}}/alumni-portal/graduates/{{graduate_id}}/public-profile`
2. في **Headers**:
   - `Content-Type: application/json`
   - `Accept-Language: ar`
3. اضغط **Send**
4. تحقق من الـ Response:
   - ✅ يجب أن يحتوي على: `fullName`, `faculty`, `department`, `graduationYear`, `image`
   - ✅ `image` يجب أن يكون من البورتال (Cloudinary URL)
   - ✅ باقي البيانات من External API

### الخطوة 4: اختبار Digital ID (Modified Endpoint)

1. أنشئ Request جديد:
   - Method: **GET**
   - URL: `{{base_url}}/alumni-portal/graduates/digital-id`
2. في **Headers**:
   - `Content-Type: application/json`
   - `Authorization: Bearer {{token}}`
   - `Accept-Language: ar`
3. اضغط **Send**
4. تحقق من الـ Response:
   - ✅ يجب أن يحتوي على: `fullName`, `faculty`, `department`, `graduationYear`, `personalPicture`
   - ✅ **يجب أن يحتوي على:** `nationalId`, `graduationId`, `qr`
   - ✅ `qr` يجب أن يكون base64 image data URL

### الخطوة 5: اختبار Generate QR Code

1. أنشئ Request جديد:
   - Method: **GET**
   - URL: `{{base_url}}/alumni-portal/graduates/digital-id/qr`
2. في **Headers**:
   - `Authorization: Bearer {{token}}`
3. اضغط **Send**
4. احفظ الـ `qrCode` و `verificationUrl` من الـ Response

### الخطوة 6: اختبار Verify QR Token

1. من الخطوة السابقة، انسخ الـ `verificationUrl`
2. استخرج الـ `token` من الـ URL (الجزء بعد `/verify/`)
3. أنشئ Request جديد:
   - Method: **GET**
   - URL: `{{base_url}}/alumni-portal/graduates/digital-id/verify/{{qr_token}}`
4. في **Headers**:
   - `Accept-Language: ar`
5. اضغط **Send**
6. تحقق من الـ Response:
   - ✅ يجب أن يحتوي على نفس البيانات من Digital ID
   - ✅ يجب أن يحتوي على: `nationalId`, `graduationId`, `qr`

---

## 🧪 حالات الاختبار (Test Cases)

### ✅ Test Case 1: Public Profile - Success
- **Input:** Valid graduate ID
- **Expected:** 200 OK مع البيانات الكاملة
- **Check:** جميع الحقول موجودة

### ✅ Test Case 2: Public Profile - Invalid ID
- **Input:** Invalid graduate ID (مثلاً 99999)
- **Expected:** 404 Not Found
- **Check:** رسالة خطأ واضحة

### ✅ Test Case 3: Public Profile - External API Down
- **Input:** Valid graduate ID لكن External API غير متاح
- **Expected:** 500 Error
- **Check:** رسالة خطأ توضح مشكلة External API

### ✅ Test Case 4: Digital ID - Without Auth
- **Input:** Request بدون token
- **Expected:** 401 Unauthorized
- **Check:** رسالة "Not authorized"

### ✅ Test Case 5: Digital ID - With Auth
- **Input:** Valid token
- **Expected:** 200 OK مع جميع البيانات + nationalId + graduationId + qr
- **Check:** جميع الحقول الجديدة موجودة

### ✅ Test Case 6: Verify QR - Valid Token
- **Input:** Valid QR token
- **Expected:** 200 OK مع البيانات الكاملة
- **Check:** nationalId, graduationId, qr موجودة

### ✅ Test Case 7: Verify QR - Expired Token
- **Input:** Expired QR token (انتظر 5 دقائق)
- **Expected:** 401 Unauthorized
- **Check:** رسالة "Invalid or expired token"

---

## 🔧 Troubleshooting

### مشكلة: "External API is not running"
**الحل:** تأكد من تشغيل `graduateApi.js` على port 5001

### مشكلة: "GRADUATE_API_URL is not configured"
**الحل:** أضف `GRADUATE_API_URL=http://localhost:5001/api/graduate` في `.env`

### مشكلة: "Not authorized"
**الحل:** تأكد من إضافة `Authorization: Bearer YOUR_TOKEN` في Headers

### مشكلة: QR Code is null
**الحل:** تأكد من تثبيت package `qrcode`: `npm install qrcode`

### مشكلة: National ID decryption failed
**الحل:** تأكد من وجود `NID_ENC_KEY` في `.env` وبنفس القيمة المستخدمة للتشفير

---

## 📊 مقارنة البيانات

| الحقل | Public Profile | Digital ID | المصدر |
|------|----------------|------------|--------|
| fullName | ✅ | ✅ | External API |
| faculty | ✅ | ✅ | External API |
| department | ✅ | ✅ | External API |
| graduationYear | ✅ | ✅ | External API |
| image/personalPicture | ✅ | ✅ | Portal (Cloudinary) |
| nationalId | ❌ | ✅ | User (Decrypted) |
| graduationId | ❌ | ✅ | Graduate Model |
| qr | ❌ | ✅ | Generated |

---

## 🎯 ملخص الـ Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/graduates/:id/public-profile` | GET | ❌ No | Get public profile (new) |
| `/graduates/digital-id` | GET | ✅ Yes | Get digital ID with QR (modified) |
| `/graduates/digital-id/qr` | GET | ✅ Yes | Generate QR code |
| `/graduates/digital-id/verify/:token` | GET | ❌ No | Verify QR token (modified) |

---

## 💡 نصائح إضافية

1. **استخدم Postman Collections:** أنشئ Collection لتنظيم جميع الـ requests
2. **استخدم Tests:** أضف tests تلقائية للتحقق من الـ responses
3. **استخدم Pre-request Scripts:** لتحديث الـ token تلقائياً
4. **احفظ Examples:** احفظ examples للـ responses الصحيحة

---

**تم إنشاء هذا الدليل بواسطة AI Assistant** 🤖
**آخر تحديث:** 2024

