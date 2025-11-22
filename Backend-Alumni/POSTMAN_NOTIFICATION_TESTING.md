# Postman Testing Guide - Notification Navigation

This guide shows you how to test the notification navigation feature in Postman.

## Prerequisites

1. **Run the migration first:**
   ```bash
   npm run migrate
   # OR if you have a custom migration command
   ```

2. **You need at least 2 user accounts** to test notifications (one sender, one receiver)

3. **Get authentication tokens** for both users

---

## Step 1: Get Authentication Tokens

### User 1 (Sender) - Login
```
POST http://localhost:5005/alumni-portal/login
Content-Type: application/json

{
  "email": "user1@example.com",
  "password": "password123"
}
```

**Save the token** from response as `USER1_TOKEN`

### User 2 (Receiver) - Login
```
POST http://localhost:5005/alumni-portal/login
Content-Type: application/json

{
  "email": "user2@example.com",
  "password": "password123"
}
```

**Save the token** from response as `USER2_TOKEN`

---

## Step 2: Trigger Notifications

### 2.1 Test Friend Request Notification

**Send Friend Request** (as User 1 to User 2):
```
POST http://localhost:5005/alumni-portal/friendships/request/:receiverId
Authorization: Bearer USER1_TOKEN
```

Replace `:receiverId` with User 2's ID.

**Expected:** User 2 will receive a notification with navigation:
```json
{
  "navigation": {
    "screen": "friend-requests",
    "action": "view"
  }
}
```

---

### 2.2 Test Post Like Notification

**Like a Post** (as User 1, on User 2's post):
```
POST http://localhost:5005/alumni-portal/posts/:postId/like
Authorization: Bearer USER1_TOKEN
```

Replace `:postId` with a post ID where User 2 is the author.

**Expected:** User 2 will receive a notification with navigation:
```json
{
  "navigation": {
    "screen": "post",
    "postId": 123
  }
}
```

---

### 2.3 Test Post Comment Notification

**Comment on a Post** (as User 1, on User 2's post):
```
POST http://localhost:5005/alumni-portal/posts/:postId/comments
Authorization: Bearer USER1_TOKEN
Content-Type: application/json

{
  "content": "Great post!"
}
```

**Expected:** User 2 will receive a notification with navigation:
```json
{
  "navigation": {
    "screen": "post",
    "postId": 123,
    "commentId": 456
  }
}
```

---

### 2.4 Test Comment Reply Notification

**Reply to a Comment** (as User 1, reply to User 2's comment):
```
POST http://localhost:5005/alumni-portal/posts/comments/:commentId/reply
Authorization: Bearer USER1_TOKEN
Content-Type: application/json

{
  "content": "I agree!"
}
```

**Expected:** User 2 will receive a notification with navigation:
```json
{
  "navigation": {
    "screen": "post",
    "postId": 123,
    "commentId": 456,
    "replyId": 789
  }
}
```

---

### 2.5 Test Message Notification

**Send a Message** (as User 1 to User 2):
```
POST http://localhost:5005/alumni-portal/chat/:chatId/messages
Authorization: Bearer USER1_TOKEN
Content-Type: application/json

{
  "content": "Hello!",
  "replyToMessageId": null
}
```

**Note:** You may need to create/get a chat first using:
```
POST http://localhost:5005/alumni-portal/chat/conversation
Authorization: Bearer USER1_TOKEN
Content-Type: application/json

{
  "userId": USER2_ID
}
```

**Expected:** User 2 will receive a notification with navigation:
```json
{
  "navigation": {
    "screen": "chat",
    "chatId": 10,
    "userId": USER1_ID
  }
}
```

---

## Step 3: Retrieve Notifications (Check Navigation Data)

### Get All Notifications (as User 2 - Receiver)
```
GET http://localhost:5005/alumni-portal/notifications
Authorization: Bearer USER2_TOKEN
```

**Query Parameters (Optional):**
- `page=1` - Page number
- `limit=20` - Items per page
- `unreadOnly=true` - Only unread notifications

**Expected Response:**
```json
{
  "status": "success",
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": 1,
      "receiverId": 2,
      "senderId": 1,
      "type": "add_user",
      "message": "John Doe sent you a connection request",
      "isRead": false,
      "createdAt": "2025-01-25T10:00:00.000Z",
      "navigation": {
        "screen": "friend-requests",
        "action": "view"
      },
      "sender": {
        "id": 1,
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": 2,
      "receiverId": 2,
      "senderId": 1,
      "type": "like",
      "message": "John Doe liked your post",
      "isRead": false,
      "createdAt": "2025-01-25T10:05:00.000Z",
      "navigation": {
        "screen": "post",
        "postId": 123
      },
      "sender": {
        "id": 1,
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": 3,
      "receiverId": 2,
      "senderId": 1,
      "type": "comment",
      "message": "John Doe commented on your post",
      "isRead": false,
      "createdAt": "2025-01-25T10:10:00.000Z",
      "navigation": {
        "screen": "post",
        "postId": 123,
        "commentId": 456
      },
      "sender": {
        "id": 1,
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": 4,
      "receiverId": 2,
      "senderId": 1,
      "type": "message",
      "message": "John Doe sent you a message",
      "isRead": false,
      "createdAt": "2025-01-25T10:15:00.000Z",
      "navigation": {
        "screen": "chat",
        "chatId": 10,
        "userId": 1
      },
      "sender": {
        "id": 1,
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalNotifications": 4,
    "hasMore": false
  }
}
```

---

## Step 4: Additional Notification Endpoints

### Get Unread Count
```
GET http://localhost:5005/alumni-portal/notifications/unread-count
Authorization: Bearer USER2_TOKEN
```

### Mark Notification as Read
```
PUT http://localhost:5005/alumni-portal/notifications/:notificationId/read
Authorization: Bearer USER2_TOKEN
```

### Mark All as Read
```
PUT http://localhost:5005/alumni-portal/notifications/read-all
Authorization: Bearer USER2_TOKEN
```

### Delete Notification
```
DELETE http://localhost:5005/alumni-portal/notifications/:notificationId
Authorization: Bearer USER2_TOKEN
```

---

## Navigation Data Structure by Type

| Notification Type | Navigation Structure |
|------------------|---------------------|
| `add_user` | `{ screen: "friend-requests", action: "view" }` |
| `accept_request` | `{ screen: "profile", userId: <senderId> }` |
| `added_to_group` | `{ screen: "group", groupId: <groupId> }` or `{ screen: "groups", action: "view" }` |
| `like` | `{ screen: "post", postId: <postId> }` |
| `comment` | `{ screen: "post", postId: <postId>, commentId: <commentId> }` |
| `reply` | `{ screen: "post", postId: <postId>, commentId: <commentId>, replyId: <replyId> }` |
| `edit_comment` | `{ screen: "post", postId: <postId>, commentId: <commentId> }` |
| `delete_comment` | `{ screen: "post", postId: <postId> }` |
| `message` | `{ screen: "chat", chatId: <chatId>, userId: <senderId> }` |
| `announcement` | `{ screen: "announcement", announcementId: <id> }` or `{ screen: "announcements", action: "view" }` |
| `role_update` | `{ screen: "profile", action: "view" }` |

---

## Testing Checklist

- [ ] Run migration to add `navigation` column
- [ ] Login as User 1 (sender)
- [ ] Login as User 2 (receiver)
- [ ] Send friend request (User 1 → User 2)
- [ ] Get notifications (User 2) - verify `navigation` field exists
- [ ] Like a post (User 1 likes User 2's post)
- [ ] Get notifications (User 2) - verify `navigation.postId` exists
- [ ] Comment on post (User 1 comments on User 2's post)
- [ ] Get notifications (User 2) - verify `navigation.postId` and `navigation.commentId` exist
- [ ] Reply to comment (User 1 replies to User 2's comment)
- [ ] Get notifications (User 2) - verify `navigation.postId`, `navigation.commentId`, and `navigation.replyId` exist
- [ ] Send message (User 1 → User 2)
- [ ] Get notifications (User 2) - verify `navigation.chatId` and `navigation.userId` exist

---

## Troubleshooting

### Issue: `navigation` field is `null` in response
**Solution:** 
1. Make sure you ran the migration
2. Check that notifications were created AFTER the migration
3. Old notifications won't have navigation data

### Issue: Notifications not being created
**Solution:**
1. Check that sender and receiver are different users
2. Verify authentication tokens are valid
3. Check server logs for errors

### Issue: Missing IDs in navigation (e.g., `commentId` is null)
**Solution:**
1. This is normal for some notification types where IDs are optional
2. Check the notification service - some functions have optional parameters

---

## Example Postman Collection Structure

```
📁 Alumni Portal - Notifications
  📁 Authentication
    POST Login User 1
    POST Login User 2
  📁 Trigger Notifications
    POST Send Friend Request
    POST Like Post
    POST Comment on Post
    POST Reply to Comment
    POST Send Message
  📁 Get Notifications
    GET All Notifications
    GET Unread Count
    PUT Mark as Read
    PUT Mark All as Read
    DELETE Notification
```

---

## Notes

- All notification endpoints require authentication
- The `navigation` field is a JSON object that tells the frontend where to navigate
- Navigation data is automatically included when notifications are created
- Old notifications (created before migration) will have `navigation: null`

