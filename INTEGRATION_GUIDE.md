# Community Post Interactions - Integration Guide

## ✅ What's Been Added

### Database Changes
- **PostShare** model: Tracks when users share community posts
- **ProjectShare** model: Tracks when users share portfolio projects
- Relationships added to User, CommunityPost, and Project models

### Backend API Routes
- `POST /community/:id/like` - Toggle like on post (already existed, unchanged)
- `POST /community/:id/comments` - Add comment (already existed, unchanged)
- `POST /community/:id/comments/:cid/like` - Like comment (already existed, unchanged)
- `POST /community/:id/share` - **NEW** Share post to profile
- `GET /community/user/:userId/shared` - **NEW** Get user's shared posts
- `POST /portfolio/projects/:id/share` - **NEW** Share project to profile
- `GET /portfolio/shares` - **NEW** Get user's shared projects

### Frontend Components
1. **PostCard** (`components/community/PostCard.tsx`)
   - Display post with like/comment/share interactions
   - Shows reactions and comment count
   - Opens share modal

2. **ProjectShareCard** (`components/community/ProjectShareCard.tsx`)
   - Display project with share button
   - Shows tech stack and links

3. **SharedPostsView** (`components/community/SharedPostsView.tsx`)
   - Display paginated list of shared posts
   - Shows user's notes with shares

4. **SharedProjectsView** (`components/community/SharedProjectsView.tsx`)
   - Display grid of shared projects
   - Shows user's notes

### Database Migrations
- `202607010000_add_post_project_shares/migration.sql`
  - Creates post_shares and project_shares tables
  - Adds foreign keys and indexes

---

## 🚀 Quick Start

### Step 1: Apply Database Migration
```bash
cd backend
npm run db:migrate
# or
npx prisma db push
```

### Step 2: Update Community Page
Replace or update your community page to use the new PostCard component:

```tsx
// frontend/src/app/dashboard/community/page.tsx
import { PostCard } from '@/components/community';

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ... fetch posts logic

  return (
    <div>
      {posts.map(post => (
        <PostCard 
          key={post.id}
          post={post}
          isLoggedIn={isLoggedIn}
          onRefresh={() => {
            // Refresh posts after interaction
            fetchPosts();
          }}
        />
      ))}
    </div>
  );
}
```

### Step 3: Add Shared Posts/Projects to User Profiles
```tsx
// In user profile page or settings
import { SharedPostsView, SharedProjectsView } from '@/components/community';

export default function UserProfile({ userId }) {
  return (
    <div>
      <h2>Shared Posts</h2>
      <SharedPostsView userId={userId} isLoggedIn={isLoggedIn} />
      
      <h2>Shared Projects</h2>
      <SharedProjectsView userId={userId} isLoggedIn={isLoggedIn} />
    </div>
  );
}
```

---

## 🔒 Login Requirement

All interactions automatically enforce login:
- Users trying to like/comment/share without being logged in are redirected to `/login`
- Check happens in components via `isLoggedIn` prop
- Backend middleware (`authenticate`) ensures authentication

---

## 📱 Testing

### Manual Testing Checklist
- [ ] Like a post with different reactions (👍, 🔥, 🚀, 💯)
- [ ] Unlike a post (click same reaction again)
- [ ] Add a comment to a post
- [ ] Share a post (with and without note)
- [ ] Unshare a post (click share button again)
- [ ] View shared posts via `/community/user/:userId/shared`
- [ ] Share a project
- [ ] View shared projects via `/portfolio/shares`
- [ ] Verify login redirect when not authenticated

### API Testing
```bash
# Get auth token first
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Copy the sh_access cookie value to use as Authorization header

# Test like endpoint
curl -X POST http://localhost:5000/api/v1/community/{postId}/like \
  -H "Cookie: sh_access={token}" \
  -H "Content-Type: application/json" \
  -d '{"reactionType":"👍"}'

# Test share endpoint
curl -X POST http://localhost:5000/api/v1/community/{postId}/share \
  -H "Cookie: sh_access={token}" \
  -H "Content-Type: application/json" \
  -d '{"note":"Great post!"}'

# Get shared posts
curl http://localhost:5000/api/v1/community/user/{userId}/shared \
  -H "Cookie: sh_access={token}"
```

---

## 🎨 Customization

### Change Reaction Emojis
Edit `POST_REACTIONS` in:
- `backend/src/routes/community.js`
- `frontend/src/components/community/PostCard.tsx`

```js
const POST_REACTIONS = ['👍', '❤️', '😂', '🔥']; // Change these
```

### Change Colors
Update the `D` object in components:
```tsx
const D = {
  card: '#0F1521',
  accent: '#4F8EF7',
  // ... etc
};
```

### Change Pagination Size
Update `PAGE_SIZE` in backend routes:
```js
const PAGE_SIZE = 15; // Change this value
```

---

## 🐛 Troubleshooting

### Migration Fails
- Ensure PostgreSQL is running and DATABASE_URL is correct
- Run `prisma db push` instead of `prisma db migrate` if issues persist
- Check for pending migrations: `prisma migrate status`

### Components Not Found
- Ensure files are created in `frontend/src/components/community/`
- Verify export in `index.ts`
- Try clearing Next.js cache: `rm -rf .next`

### Login Redirect Not Working
- Check that `isLoggedIn` prop is being passed correctly
- Verify `/login` route exists
- Ensure auth token is in cookies (check browser dev tools)

### API Returns 401
- Token may have expired
- Check that `authenticate` middleware is applied to routes
- Verify JWT secrets in .env

---

## 📊 Database Queries

View shared posts for analytics:
```sql
-- Get most shared posts
SELECT post_id, COUNT(*) as share_count
FROM post_shares
GROUP BY post_id
ORDER BY share_count DESC;

-- Get most active sharers
SELECT user_id, COUNT(*) as total_shares
FROM post_shares
GROUP BY user_id
ORDER BY total_shares DESC;

-- Get shares in last 7 days
SELECT * FROM post_shares
WHERE shared_at >= NOW() - INTERVAL '7 days'
ORDER BY shared_at DESC;
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production` in backend
- [ ] Verify all environment variables are set
- [ ] Run migration in production: `npx prisma migrate deploy`
- [ ] Test all endpoints with production credentials
- [ ] Monitor error logs for issues
- [ ] Set up database backups
- [ ] Configure rate limiting appropriately

### Performance Tips
- Cache user data to reduce DB queries
- Use database indexes (already added in migration)
- Implement pagination for shared content feeds
- Consider Redis caching for reaction counts

---

## 📝 Notes

- Shares are stored in separate tables for analytics and audit trails
- Comments and likes already existed in the schema (unchanged)
- All interactions require authentication (enforced by backend middleware)
- Shared posts retain their original metadata (views, likes, etc.)
- Users can only share their own projects
- Anyone can share public community posts
