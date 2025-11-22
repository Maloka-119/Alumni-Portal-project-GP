# How to Approve Pending User Accounts

When a user tries to login and gets "Your account is pending approval", you need to approve them as an **Admin** or **Staff** user.

---

## Step 1: Login as Admin

First, you need to login with an admin account:

```
POST http://localhost:5005/alumni-portal/login
Content-Type: application/json

{
  "email": "alumniportalhelwan@gmail.com",
  "password": "admin123"
}
```

**Save the token** from the response as `ADMIN_TOKEN`

---

## Step 2: Get List of Pending Graduates

Get all users waiting for approval:

```
GET http://localhost:5005/alumni-portal/graduates/requested
Authorization: Bearer ADMIN_TOKEN
```

**Response Example:**
```json
{
  "status": "success",
  "message": "Requested graduates fetched successfully",
  "data": [
    {
      "User": {
        "id": 5,
        "firstName": "Sara",
        "lastName": "Staff",
        "email": "sara.staff@example.com",
        "nationalId": "12345678901234",
        "phoneNumber": "01234567890"
      },
      "graduate_id": 5,
      "graduation-year": null,
      "faculty_code": null
    }
  ]
}
```

**Find the user** you want to approve and note their:
- `graduate_id` (this is the `id` you'll use in the approval endpoint)
- `email` (to confirm it's the right user)

---

## Step 3: Approve the User

Approve the graduate by their `graduate_id`:

```
PUT http://localhost:5005/alumni-portal/graduates/approve/:id
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "faculty": "Engineering",
  "graduationYear": "2020"
}
```

**Replace `:id`** with the `graduate_id` from Step 2.

**Required Fields:**
- `faculty` - The faculty/college name (e.g., "Engineering", "Medicine", "Commerce")
- `graduationYear` - The year they graduated (e.g., "2020", "2019")

**Valid Faculty Names:**
- Engineering
- Medicine
- Commerce
- Science
- Law
- Arts
- Education
- Agriculture
- Fine Arts
- Physical Education
- (Check your system for the exact names)

**Response Example:**
```json
{
  "message": "Graduate approved successfully.",
  "graduateId": 5,
  "facultyCode": "ENG",
  "facultyName": "Engineering"
}
```

---

## Step 4: User Can Now Login

After approval, the user (`sara.staff@example.com`) can now login successfully:

```
POST http://localhost:5005/alumni-portal/login
Content-Type: application/json

{
  "email": "sara.staff@example.com",
  "password": "SecurePassword123!"
}
```

---

## Quick Example for Your Case

Based on your Postman screenshot, to approve `sara.staff@example.com`:

1. **Login as Admin:**
   ```
   POST http://localhost:5005/alumni-portal/login
   {
     "email": "alumniportalhelwan@gmail.com",
     "password": "admin123"
   }
   ```

2. **Get Pending Users:**
   ```
   GET http://localhost:5005/alumni-portal/graduates/requested
   Authorization: Bearer <ADMIN_TOKEN>
   ```
   
   Find the user with email `sara.staff@example.com` and note their `graduate_id` (let's say it's `5`).

3. **Approve the User:**
   ```
   PUT http://localhost:5005/alumni-portal/graduates/approve/5
   Authorization: Bearer <ADMIN_TOKEN>
   {
     "faculty": "Engineering",
     "graduationYear": "2020"
   }
   ```

4. **User Can Now Login:**
   ```
   POST http://localhost:5005/alumni-portal/login
   {
     "email": "sara.staff@example.com",
     "password": "SecurePassword123!"
   }
   ```

---

## Alternative: Find User ID by Email

If you know the email but need to find the user ID, you can search:

```
GET http://localhost:5005/alumni-portal/users/search?q=sara.staff@example.com
Authorization: Bearer ADMIN_TOKEN
```

This will return the user's ID which you can use in the approval endpoint.

---

## Notes

- Only **Admin** or **Staff** users with the "Others Requests management" permission can approve graduates
- The `faculty` name will be normalized to a faculty code automatically
- Once approved, the user's `status-to-login` is set to `"accepted"` and they can login immediately
- You can also reject users using:
  ```
  PUT http://localhost:5005/alumni-portal/graduates/reject/:id
  Authorization: Bearer ADMIN_TOKEN
  ```

