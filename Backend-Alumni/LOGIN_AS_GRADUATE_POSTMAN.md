# Login as Graduate User - Postman Guide

Follow these steps to login as a graduate user in Postman.

---

## Option 1: Register a New Graduate User

### Step 1: Register a New Graduate

```
POST http://localhost:5005/alumni-portal/register
Content-Type: application/json

{
  "firstName": "Ahmed",
  "lastName": "Mohamed",
  "email": "ahmed.graduate@example.com",
  "password": "Password123!",
  "nationalId": "12345678901234",
  "phoneNumber": "01234567890"
}
```

**Note:** 
- Use a valid Egyptian National ID format (14 digits)
- The email must be unique
- After registration, the account will be **pending approval** if the national ID is not found in the graduate system

**Response:**
```json
{
  "id": 5,
  "email": "ahmed.graduate@example.com",
  "userType": "graduate",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Step 2: Approve the Graduate (If Pending)

If the registration shows the account is pending, you need to approve it as admin:

### 2.1 Login as Admin

```
POST http://localhost:5005/alumni-portal/login
Content-Type: application/json

{
  "email": "alumniportalhelwan@gmail.com",
  "password": "admin123"
}
```

**Save the token** from response.

### 2.2 Get Pending Graduates

```
GET http://localhost:5005/alumni-portal/graduates/requested
Authorization: Bearer <ADMIN_TOKEN>
```

Find the user you just registered and note their `graduate_id` (the `id` field).

### 2.3 Approve the Graduate

```
PUT http://localhost:5005/alumni-portal/graduates/approve/<graduate_id>
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "faculty": "كلية الهندسة بحلوان",
  "graduationYear": "2020"
}
```

**Valid Faculty Names (Arabic):**
- `كلية الهندسة بحلوان` (Engineering Helwan)
- `كلية الهندسة بالمطرية` (Engineering Mataria)
- `كلية الحاسبات والذكاء الاصطناعي` (Computers & AI)
- `كلية العلوم` (Science)
- `كلية الطب` (Medicine)
- `كلية الصيدلة` (Pharmacy)
- `كلية التجارة وإدارة الأعمال` (Commerce)
- `كلية الآداب` (Arts)
- `كلية الحقوق` (Law)
- `كلية التربية` (Education)

**Or use English:**
- `Faculty of Engineering (Helwan)`
- `Faculty of Science`
- `Faculty of Medicine`
- etc.

**Response:**
```json
{
  "message": "Graduate approved successfully.",
  "graduateId": 5,
  "facultyCode": "ENG_HEL",
  "facultyName": "كلية الهندسة بحلوان"
}
```

---

## Step 3: Login as the Graduate

Now you can login as the graduate:

```
POST http://localhost:5005/alumni-portal/login
Content-Type: application/json

{
  "email": "ahmed.graduate@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "id": 5,
  "email": "ahmed.graduate@example.com",
  "userType": "graduate",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save this token** - this is your graduate user token!

---

## Option 2: Use an Existing Graduate Account

If you already have a graduate account registered:

### Just Login:

```
POST http://localhost:5005/alumni-portal/login
Content-Type: application/json

{
  "email": "existing.graduate@example.com",
  "password": "their_password"
}
```

**If you get "pending approval" error:**
- Follow Step 2 above to approve the account first

---

## Quick Test: Send Friend Request

Once logged in as a graduate, you can test notifications:

### 1. Get Your User ID
From the login response, note your `id` (e.g., `5`)

### 2. Send Friend Request to Another User
```
POST http://localhost:5005/alumni-portal/friendships/request/2
Authorization: Bearer <GRADUATE_TOKEN>
```

Replace `2` with a valid user ID (not your own ID).

### 3. Check Notifications
Login as the receiver and get notifications:
```
GET http://localhost:5005/alumni-portal/notifications
Authorization: Bearer <RECEIVER_TOKEN>
```

You should see the notification with navigation data!

---

## Troubleshooting

### Error: "Your account is pending approval"
→ You need to approve the account as admin (Step 2 above)

### Error: "Invalid email or password"
→ Check your email and password are correct

### Error: "National ID not recognized"
→ The national ID format might be wrong, or it's not in the graduate system. The account will be created but pending approval.

### Error: "Foreign key constraint violation"
→ The user ID you're trying to send a request to doesn't exist. Use a valid user ID.

---

## Summary

1. **Register** a new graduate OR use existing credentials
2. **Approve** the account (if pending) - requires admin login
3. **Login** as the graduate
4. **Save the token** for API requests
5. **Test notifications** by sending friend requests, liking posts, etc.

