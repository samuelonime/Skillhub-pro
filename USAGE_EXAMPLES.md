# Community Interactions - Usage Examples

## 🎯 Quick Examples

### Example 1: Displaying Posts with Interactions

```tsx
// pages/dashboard/community/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PostCard, SharedPostsView } from '@/components/community';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function CommunityPage() {
  const { user, isLoggedIn } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      setLoading(true);
      const res = await apiFetch('/community');
      if (res.success) {
        setPosts(res.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading posts...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Community</h1>
      
      {/* Posts with all interactions */}
      <div className="space-y-4">
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            isLoggedIn={isLoggedIn}
            onRefresh={fetchPosts}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Example 2: User Profile with Shared Content

```tsx
// pages/profile/[userId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { SharedPostsView, SharedProjectsView } from '@/components/community';
import { useAuth } from '@/hooks/useAuth';

export default function UserProfilePage() {
  const { userId } = useParams();
  const { isLoggedIn } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Shared Posts</h2>
        <SharedPostsView 
          userId={userId as string}
          isLoggedIn={isLoggedIn}
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Shared Projects</h2>
        <SharedProjectsView 
          userId={userId as string}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}
```

---

### Example 3: Portfolio with Share Buttons

```tsx
// pages/dashboard/portfolio/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ProjectShareCard } from '@/components/community';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function PortfolioPage() {
  const { isLoggedIn } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await apiFetch('/portfolio/projects');
      if (res.success) {
        setProjects(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Projects</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectShareCard
            key={project.id}
            project={project}
            isLoggedIn={isLoggedIn}
            onRefresh={fetchProjects}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Example 4: Custom Hook for Interactions

```tsx
// hooks/useCommunityPost.ts
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export function useCommunityPost(postId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const like = async (reactionType: string) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/community/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ reactionType }),
      });
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err) {
      setError('Failed to like post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const comment = async (body: string) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/community/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err) {
      setError('Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const share = async (note?: string) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/community/${postId}/share`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      if (!res.success) {
        setError(res.message);
      }
      return res;
    } catch (err) {
      setError('Failed to share post');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { like, comment, share, loading, error };
}

// Usage in component:
// const { like, comment, share } = useCommunityPost(postId);
```

---

### Example 5: Activity Feed Component

```tsx
// components/ActivityFeed.tsx
'use client';

import { useState, useEffect } from 'react';
import { PostCard } from '@/components/community';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function ActivityFeed() {
  const { isLoggedIn } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [page]);

  async function loadActivities() {
    try {
      const res = await apiFetch(`/community/activity-feed?page=${page}`);
      if (res.success) {
        if (page === 1) {
          setActivities(res.data.activities);
        } else {
          setActivities([...activities, ...res.data.activities]);
        }
        setHasMore(page < res.data.pages);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Activity Feed</h2>
      
      {activities.map(activity => (
        <div key={activity.id} className="mb-4">
          <div className="flex items-center gap-2 mb-2 text-sm">
            <span className="text-2xl">{activity.icon}</span>
            <span>
              {activity.user?.firstName} {activity.user?.lastName}
            </span>
            <span className="text-gray-400">{activity.label}</span>
          </div>
          
          {activity.post && (
            <PostCard 
              post={activity.post}
              isLoggedIn={isLoggedIn}
            />
          )}
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => setPage(page + 1)}
          className="w-full px-4 py-2 text-center"
        >
          Load More Activities
        </button>
      )}
    </div>
  );
}
```

---

### Example 6: Share Modal with Custom Styling

```tsx
// components/ShareModal.tsx
'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface ShareModalProps {
  isOpen: boolean;
  postId: string;
  onClose: () => void;
  onShare?: () => void;
}

export function ShareModal({ isOpen, postId, onClose, onShare }: ShareModalProps) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleShare() {
    try {
      setLoading(true);
      const res = await apiFetch(`/community/${postId}/share`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });

      if (res.success) {
        setNote('');
        onShare?.();
        onClose();
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Share This Post</h2>
        
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a personal note..."
          className="w-full p-3 border rounded-lg mb-4 resize-none"
          rows={4}
        />

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Example 7: Real-time Updates with Optimistic UI

```tsx
// hooks/useOptimisticLike.ts
import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export function useOptimisticLike(postId: string, initialData: any) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async (reactionType: string) => {
    const previousData = data;
    const isCurrentlyLiked = data.likedByMe;

    // Optimistic update
    setData(prev => ({
      ...prev,
      likedByMe: !isCurrentlyLiked,
      likes: isCurrentlyLiked ? prev.likes - 1 : prev.likes + 1,
      reactionType: !isCurrentlyLiked ? reactionType : null,
    }));

    try {
      setLoading(true);
      const res = await apiFetch(`/community/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ reactionType }),
      });

      if (res.success) {
        setData(prev => ({
          ...prev,
          ...res.data,
        }));
      } else {
        // Revert on error
        setData(previousData);
      }
    } catch (error) {
      // Revert on error
      setData(previousData);
      console.error('Like failed:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, data]);

  return { ...data, toggleLike: toggle, loading };
}

// Usage:
// const { likedByMe, toggleLike } = useOptimisticLike(postId, post);
```

---

### Example 8: API Client Service

```tsx
// services/communityService.ts
import { apiFetch } from '@/lib/api';

export const communityService = {
  // Posts
  async getPost(postId: string) {
    return apiFetch(`/community/${postId}`);
  },

  async getPosts(page = 1, type?: string) {
    return apiFetch(`/community?page=${page}${type ? `&type=${type}` : ''}`);
  },

  async createPost(data: any) {
    return apiFetch('/community', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Interactions
  async likePost(postId: string, reactionType: string) {
    return apiFetch(`/community/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ reactionType }),
    });
  },

  async addComment(postId: string, body: string) {
    return apiFetch(`/community/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },

  async sharePost(postId: string, note?: string) {
    return apiFetch(`/community/${postId}/share`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  // Shared content
  async getSharedPosts(userId: string, page = 1) {
    return apiFetch(`/community/user/${userId}/shared?page=${page}`);
  },

  async getSharedProjects(userId: string, page = 1) {
    return apiFetch(`/portfolio/shares?userId=${userId}&page=${page}`);
  },

  // Activity
  async getActivityFeed(page = 1) {
    return apiFetch(`/community/activity-feed?page=${page}`);
  },
};

// Usage:
// const posts = await communityService.getPosts();
// await communityService.sharePost(postId, 'Great post!');
```

---

## 🎨 Styling Customization

### Theme Tokens
All components use this color scheme:
```tsx
const D = {
  card: '#0F1521',           // Card background
  border: 'rgba(255,255,255,0.07)',  // Borders
  accent: '#4F8EF7',         // Primary color
  green: '#00E5A0',          // Success/highlight
  amber: '#F59E0B',          // Warning/tags
  red: '#F87171',            // Danger
  text: 'rgba(255,255,255,0.85)',    // Main text
  subtext: 'rgba(255,255,255,0.45)', // Secondary text
};
```

To customize globally, update component files or create a shared theme file.

---

## 📱 Responsive Design

Components are built with Tailwind CSS and support:
- Mobile: Full-width layouts
- Tablet: Grid columns adjust
- Desktop: Multi-column layouts

Example breakpoints used:
- `max-md:` - Mobile adjustments
- `md:` - Tablet and up
- `lg:` - Large screens
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` - Responsive grid

---

## ✨ That's it!

You now have a complete post interaction system with:
- Multi-reaction liking
- Comments
- Post sharing
- Shared content views
- Full authentication
- Responsive design
- Production-ready code
