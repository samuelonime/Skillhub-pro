# Community Post Interactions Guide

## Features Added

### 1. **Like/React to Posts**
- Users can like posts with multiple reaction types: 👍, 🔥, 🚀, 💯
- Requires login (unauthenticated users are redirected to /login)
- Clicking the reaction icon opens a menu to select different reactions
- Reactions are tracked and displayed with counts

### 2. **Comments**
- Users can add comments to any post
- Comments show author, timestamp, and text
- Comment likes are supported
- Requires login to comment

### 3. **Share Posts**
- Users can share posts to their profile
- Optional note can be added when sharing
- Shared posts are visible on the user's profile
- Share functionality works for:
  - Community posts (discussions, projects, questions, etc.)
  - Project portfolio items

### 4. **Shared Content Views**
- Each user has a dedicated "Shared" section showing their shared posts and projects
- Shared posts display the original post with user's optional note
- Shared projects display in a grid format with project details

---

## Backend API Endpoints

### Community Posts

#### Like/React to a Post
```
POST /api/v1/community/:postId/like
Content-Type: application/json

{
  "reactionType": "👍" // or 🔥, 🚀, 💯
}

Response:
{
  "success": true,
  "data": {
    "liked": true,
    "reactionType": "👍",
    "reactions": { "👍": 5, "🔥": 2 }
  }
}
```

#### Add Comment
```
POST /api/v1/community/:postId/comments
Content-Type: application/json

{
  "body": "Great post!"
}

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "body": "Great post!",
    "likes": 0,
    "author": { ... },
    "createdAt": "2025-07-01T...",
    "likedByMe": false
  }
}
```

#### Like a Comment
```
POST /api/v1/community/:postId/comments/:commentId/like

Response:
{
  "success": true,
  "data": {
    "liked": true
  }
}
```

#### Share a Post
```
POST /api/v1/community/:postId/share
Content-Type: application/json

{
  "note": "This is amazing!" // optional
}

Response:
{
  "success": true,
  "data": {
    "shared": true,
    "shareId": "..."
  }
}
```

#### Get User's Shared Posts
```
GET /api/v1/community/user/:userId/shared?page=1

Response:
{
  "success": true,
  "data": {
    "shares": [
      {
        "id": "...",
        "note": "Check this out!",
        "sharedAt": "2025-07-01T...",
        "post": { ... }
      }
    ],
    "total": 10,
    "page": 1,
    "pages": 1
  }
}
```

---

### Portfolio Projects

#### Share a Project
```
POST /api/v1/portfolio/projects/:projectId/share
Content-Type: application/json

{
  "note": "My latest project!" // optional
}

Response:
{
  "success": true,
  "data": {
    "shared": true,
    "shareId": "..."
  }
}
```

#### Get User's Shared Projects
```
GET /api/v1/portfolio/shares?userId=... &page=1

Response:
{
  "success": true,
  "data": {
    "shares": [
      {
        "id": "...",
        "note": "Built with React",
        "sharedAt": "2025-07-01T...",
        "project": { ... }
      }
    ],
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

---

## Frontend Components

### PostCard Component
Used to display a community post with all interactions:

```tsx
import { PostCard } from '@/components/community';

<PostCard 
  post={postData}
  onRefresh={() => refreshList()}
  isLoggedIn={!!user}
/>
```

**Props:**
- `post`: Community post object with reactions, comments count
- `onRefresh?`: Optional callback when post is shared/commented
- `isLoggedIn?`: Boolean indicating if user is authenticated

**Features:**
- Shows post title, body, tags
- Display likes with reaction menu
- Comment section with ability to add/view comments
- Share button with modal
- View count

---

### ProjectShareCard Component
Used to display a shareable project:

```tsx
import { ProjectShareCard } from '@/components/community';

<ProjectShareCard 
  project={projectData}
  onRefresh={() => refreshList()}
  isLoggedIn={!!user}
/>
```

**Props:**
- `project`: Project object with details
- `onRefresh?`: Optional callback when project is shared
- `isLoggedIn?`: Boolean indicating if user is authenticated

**Features:**
- Project thumbnail
- Title and description
- Tech stack badges
- Live demo and GitHub links
- Share button

---

### SharedPostsView Component
Display all posts shared by a user:

```tsx
import { SharedPostsView } from '@/components/community';

<SharedPostsView 
  userId={userId}
  isLoggedIn={!!user}
/>
```

**Props:**
- `userId`: The user whose shared posts to display
- `isLoggedIn?`: Boolean indicating if current user is authenticated

**Features:**
- Paginated list of shared posts
- Shows user's optional note with each share
- Load more button
- Empty state when no shares

---

### SharedProjectsView Component
Display all projects shared by a user:

```tsx
import { SharedProjectsView } from '@/components/community';

<SharedProjectsView 
  userId={userId}
  isLoggedIn={!!user}
/>
```

**Props:**
- `userId`: The user whose shared projects to display
- `isLoggedIn?`: Boolean indicating if current user is authenticated

**Features:**
- Grid layout of shared projects
- Shows user's optional note with each share
- Paginated with load more
- Empty state handling

---

## Database Schema

### PostShare Table
```prisma
model PostShare {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  note      String?  @db.Text
  sharedAt  DateTime @default(now())

  user User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  post CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId])
  @@index([postId])
  @@map("post_shares")
}
```

### ProjectShare Table
```prisma
model ProjectShare {
  id        String   @id @default(uuid())
  userId    String
  projectId String
  note      String?  @db.Text
  sharedAt  DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([userId, projectId])
  @@index([userId])
  @@index([projectId])
  @@map("project_shares")
}
```

---

## Authentication & Security

### Login Required
All interaction endpoints require authentication:
- **Like a post/comment**: Must be logged in
- **Add a comment**: Must be logged in
- **Share a post/project**: Must be logged in

If a user is not authenticated and attempts an interaction, they're redirected to `/login`.

### Authorization
- Users can only delete/edit their own comments (or admins can)
- Users can only share (and unshare) their own projects
- Anyone can like/comment on public posts

---

## Migration & Setup

### 1. Apply Database Migration
```bash
cd backend
npm run db:migrate
# or
npx prisma db push
```

### 2. Test Endpoints
```bash
# Share a post
curl -X POST http://localhost:5000/api/v1/community/{postId}/share \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"note": "Great post!"}'

# Get shared posts
curl http://localhost:5000/api/v1/community/user/{userId}/shared \
  -H "Authorization: Bearer {token}"
```

### 3. Use Components in Frontend
Import and use components in your pages:
```tsx
import { PostCard, SharedPostsView } from '@/components/community';

export default function CommunityPage() {
  return (
    <div>
      {/* Render posts with interactions */}
      {posts.map(post => <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} />)}
      
      {/* Show shared posts for a user */}
      <SharedPostsView userId={userId} isLoggedIn={isLoggedIn} />
    </div>
  );
}
```

---

## Best Practices

1. **Login Handling**: Always check `isLoggedIn` before allowing interactions
2. **Error Messages**: Show user-friendly error messages if interactions fail
3. **Loading States**: Use loading indicators while API calls are in progress
4. **Optimistic Updates**: Update UI immediately, revert on error
5. **Rate Limiting**: Backend has rate limiting enabled (200 requests/15 min)

---

## Future Enhancements

- [ ] Share to social media (Twitter, LinkedIn)
- [ ] Email notifications for likes/comments
- [ ] Comment threading and replies
- [ ] Emoji reactions with Giphy integration
- [ ] Post bookmarks
- [ ] Share analytics (who shared, when, engagement)
- [ ] Mention system (@username notifications)
- [ ] Hashtag support and trending hashtags
