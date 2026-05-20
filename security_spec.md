# Security Specification - Piano Bear Tracker

## Data Invariants
1. A Course must belong to a valid User.
2. A Course must have exactly 8 sessions or fewer (max 8).
3. Only the owner of the data can read or write their own data.
4. Users cannot modify their `id` or `email` once set.
5. All timestamps (`updatedAt`) must be server-side validated.

## The "Dirty Dozen" Payloads (Deny Cases)

1. **Identity Spoofing**: Attempt to create a user document with a different UID.
   - Path: `/users/hacker-id`
   - Auth: `uid: victim-id`
2. **Ghost Field Injection**: Adding an `isAdmin` field to the user profile.
   - Path: `/users/my-id`
   - Data: `{ ..., isAdmin: true }`
3. **Session Overflow**: Adding more than 8 sessions to a course.
   - Path: `/users/my-id/courses/course-1`
   - Data: `{ ..., sessions: [1,2,3,4,5,6,7,8,9] }`
4. **Outcome State Shortcut**: Setting a course to `isCompleted: true` without sessions.
   - Path: `/users/my-id/courses/course-1`
   - Data: `{ ..., sessions: [], isCompleted: true }`
5. **Fee Poisoning**: Setting fee to a negative number.
   - Path: `/users/my-id/courses/course-1`
   - Data: `{ ..., fee: -1000000 }`
6. **Cross-User Course Creation**: Creating a course in another user's subcollection.
   - Path: `/users/victim-id/courses/my-course`
   - Auth: `uid: my-id`
7. **Cross-User User Profile Edit**: Editing another user's profile.
   - Path: `/users/victim-id`
   - Auth: `uid: my-id`
8. **Resource Poisoning**: Setting `courseNumber` to a massive string or invalid type.
   - Path: `/users/my-id/courses/course-1`
   - Data: `{ ..., courseNumber: "not-a-number" }`
9. **Timestamp Spoofing**: Sending a client-side date for `updatedAt`.
   - Path: `/users/my-id`
   - Data: `{ ..., updatedAt: "2020-01-01T00:00:00Z" }`
10. **Orphaned Course**: Attempting to create a course without a parent user document (if enforcement enabled).
11. **Malicious ID Injection**: Creating a course with an ID that has invalid characters.
    - Path: `/users/my-id/courses/course!!!123`
12. **PII Blanket Read**: Trying to list all users as a regular authenticated user.
    - Path: `/users`
    - Auth: `uid: some-id`
