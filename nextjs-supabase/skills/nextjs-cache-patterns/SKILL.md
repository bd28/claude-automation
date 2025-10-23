---
name: nextjs-cache-patterns
version: 1.0.0
description: Apply tag-based caching to API routes with automatic revalidation
category: performance
tags: [nextjs, caching, performance, revalidation]
applies_to: [feature-builder, code-reviewer]
trigger: when_creating_api_routes
priority: high
---

# Next.js Cache Patterns Skill

## Purpose

Automatically implement efficient tag-based caching for Next.js API routes and server actions. This improves performance and reduces database load while ensuring data freshness through smart revalidation.

## When to Apply This Skill

Apply this skill automatically when:
- Creating new API routes (Route Handlers)
- Creating new Server Actions
- Fetching data from the database
- Implementing data mutations (create, update, delete)

Do NOT apply when:
- Handling user-specific data that shouldn't be cached
- Processing real-time data that changes frequently
- Handling authentication/authorization endpoints

## How to Apply This Skill

### 1. Cache GET Requests with Tags

Use Next.js `unstable_cache` with descriptive tags:

```typescript
import { unstable_cache } from 'next/cache';

export async function GET(request: Request) {
  const posts = await unstable_cache(
    async () => {
      return await db.query.posts.findMany({
        where: eq(posts.published, true),
        orderBy: [desc(posts.createdAt)],
      });
    },
    ['posts-list'], // Cache key
    {
      tags: ['posts'], // Revalidation tag
      revalidate: 3600, // Optional: revalidate after 1 hour
    }
  )();

  return Response.json({ posts });
}
```

### 2. Revalidate on Mutations

Use `revalidateTag` after data changes:

```typescript
import { revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const data = await request.json();

  const newPost = await db.insert(posts).values({
    title: data.title,
    content: data.content,
    published: true,
  }).returning();

  // Invalidate all caches tagged with 'posts'
  revalidateTag('posts');

  return Response.json({ post: newPost });
}
```

### 3. Use Granular Tags

Create specific tags for different data types and relationships:

```typescript
// Tag patterns:
// - 'posts' - All posts
// - 'post-123' - Specific post by ID
// - 'user-456-posts' - Posts by specific user
// - 'categories' - All categories

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await unstable_cache(
    async () => {
      return await db.query.posts.findFirst({
        where: eq(posts.id, params.id),
      });
    },
    [`post-${params.id}`],
    {
      tags: ['posts', `post-${params.id}`],
      revalidate: 3600,
    }
  )();

  return Response.json({ post });
}
```

### 4. Revalidate Multiple Tags

Invalidate related caches when data changes:

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();

  const updatedPost = await db
    .update(posts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(posts.id, params.id))
    .returning();

  // Revalidate multiple related tags
  revalidateTag('posts');
  revalidateTag(`post-${params.id}`);
  revalidateTag(`user-${updatedPost[0].userId}-posts`);

  return Response.json({ post: updatedPost[0] });
}
```

### 5. Use Server Actions with Cache

Apply the same pattern to Server Actions:

```typescript
'use server';

import { unstable_cache, revalidateTag } from 'next/cache';

export async function getPosts() {
  return await unstable_cache(
    async () => {
      return await db.query.posts.findMany({
        where: eq(posts.published, true),
      });
    },
    ['posts-list'],
    {
      tags: ['posts'],
      revalidate: 3600,
    }
  )();
}

export async function createPost(data: NewPost) {
  const newPost = await db.insert(posts).values(data).returning();

  revalidateTag('posts');

  return newPost[0];
}
```

### 6. Set Appropriate Revalidation Times

Choose revalidation periods based on data volatility:

- **Static content** (docs, marketing): `revalidate: 86400` (24 hours)
- **Semi-static** (blog posts, products): `revalidate: 3600` (1 hour)
- **Dynamic** (user feeds, notifications): `revalidate: 60` (1 minute) or omit for on-demand only
- **Real-time** (chat, live data): Don't cache, or use very short TTL

## Examples

### Good Examples

#### List Endpoint with Caching
```typescript
// app/api/posts/route.ts
import { unstable_cache } from 'next/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const posts = await unstable_cache(
    async () => {
      const query = db.query.posts.findMany({
        where: category
          ? eq(posts.category, category)
          : eq(posts.published, true),
        orderBy: [desc(posts.createdAt)],
      });
      return await query;
    },
    category ? [`posts-category-${category}`] : ['posts-list'],
    {
      tags: category ? ['posts', `category-${category}`] : ['posts'],
      revalidate: 3600,
    }
  )();

  return Response.json({ posts });
}
```

#### Detail Endpoint with Granular Tags
```typescript
// app/api/posts/[id]/route.ts
import { unstable_cache, revalidateTag } from 'next/cache';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await unstable_cache(
    async () => {
      return await db.query.posts.findFirst({
        where: eq(posts.id, params.id),
        with: {
          author: true,
          comments: true,
        },
      });
    },
    [`post-${params.id}-full`],
    {
      tags: ['posts', `post-${params.id}`],
      revalidate: 1800, // 30 minutes
    }
  )();

  if (!post) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ post });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();

  const updatedPost = await db
    .update(posts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(posts.id, params.id))
    .returning();

  // Revalidate all related caches
  revalidateTag('posts');
  revalidateTag(`post-${params.id}`);

  return Response.json({ post: updatedPost[0] });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await db.delete(posts).where(eq(posts.id, params.id));

  revalidateTag('posts');
  revalidateTag(`post-${params.id}`);

  return Response.json({ success: true });
}
```

### Bad Examples

```typescript
// ❌ No caching - every request hits the database
export async function GET(request: Request) {
  const posts = await db.query.posts.findMany();
  return Response.json({ posts });
}

// ❌ Caching without tags - can't invalidate selectively
export async function GET(request: Request) {
  const posts = await unstable_cache(
    async () => await db.query.posts.findMany(),
    ['posts']
  )();
  return Response.json({ posts });
}

// ❌ Mutation without cache invalidation
export async function POST(request: Request) {
  const data = await request.json();
  const newPost = await db.insert(posts).values(data).returning();
  // Missing: revalidateTag('posts');
  return Response.json({ post: newPost });
}

// ❌ Too aggressive caching for user-specific data
export async function GET(request: Request) {
  const session = await getSession();

  // This will cache user-specific data globally!
  const userPosts = await unstable_cache(
    async () => await db.query.posts.findMany({
      where: eq(posts.userId, session.user.id),
    }),
    ['user-posts'], // ❌ Same key for all users!
    { tags: ['posts'] }
  )();

  return Response.json({ posts: userPosts });
}
```

## Integration Points

This skill is automatically applied by:
- **feature-builder agent** - When creating API routes (step 3)
- **code-reviewer agent** - Validates caching is implemented correctly

## Checklist

When applying this skill, verify:
- [ ] All GET endpoints use `unstable_cache` with appropriate tags
- [ ] Cache keys are unique and descriptive
- [ ] Tags allow for granular invalidation
- [ ] Mutations (POST/PATCH/DELETE) call `revalidateTag`
- [ ] Revalidation times match data volatility
- [ ] User-specific data is not cached globally
- [ ] Related tags are revalidated together
- [ ] Cache doesn't include sensitive data

## Common Tag Patterns

### Entity-Based Tags
```typescript
tags: ['users']                    // All users
tags: ['users', `user-${id}`]     // Specific user
```

### Relationship Tags
```typescript
tags: ['posts', `user-${userId}-posts`]  // User's posts
tags: ['comments', `post-${postId}-comments`]  // Post's comments
```

### Category/Filter Tags
```typescript
tags: ['products', `category-${categoryId}`]  // Products in category
tags: ['events', 'upcoming-events']  // Upcoming events
```

### Hierarchy Tags
```typescript
tags: ['organizations', `org-${orgId}`, `org-${orgId}-teams`]
```

## Related Skills

- **test-strategy-patterns** - Test cache invalidation in integration tests
- **rls-security-patterns** - Ensure cached data respects RLS policies

## References

- [Next.js Data Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [unstable_cache API](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [revalidateTag API](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
