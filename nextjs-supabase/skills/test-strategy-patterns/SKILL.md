---
name: test-strategy-patterns
version: 1.0.0
description: Follow unit-first testing strategy with comprehensive coverage
category: testing
tags: [testing, vitest, playwright, e2e, unit-tests]
applies_to: [feature-builder, test-validator]
trigger: when_writing_code
priority: critical
---

# Test Strategy Patterns Skill

## Purpose

Follow a structured, unit-first testing approach that ensures code quality while minimizing test maintenance burden. Write tests that are fast, reliable, and provide confidence in your code.

## When to Apply This Skill

Apply this skill automatically when:
- Implementing new features
- Creating new functions or components
- Fixing bugs
- Refactoring existing code
- Adding new API routes or server actions

Always write tests BEFORE or alongside implementation, never as an afterthought.

## How to Apply This Skill

### 1. Testing Pyramid Strategy

Follow the testing pyramid (most to least):
1. **Unit Tests** (70-80%) - Fast, focused, isolated
2. **Integration Tests** (15-25%) - Test component interactions
3. **E2E Tests** (5-10%) - Critical user flows only

### 2. Unit Tests First

Start with unit tests for all business logic:

```typescript
// lib/utils/formatCurrency.ts
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// lib/utils/formatCurrency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats USD amounts correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('handles zero amount', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('supports different currencies', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(1234.567)).toBe('$1,234.57');
  });
});
```

### 3. Test File Colocation

Place test files next to the code they test:

```
lib/
  utils/
    formatCurrency.ts
    formatCurrency.test.ts
  hooks/
    useAuth.ts
    useAuth.test.ts
app/
  api/
    posts/
      route.ts
      route.test.ts
```

### 4. Integration Tests for Interactions

Test how components work together:

```typescript
// app/api/posts/route.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from './route';
import * as db from '@/lib/db';

vi.mock('@/lib/db');

describe('POST /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new post', async () => {
    const mockPost = {
      id: '123',
      title: 'Test Post',
      content: 'Test content',
      userId: 'user-1',
    };

    vi.mocked(db.insert).mockResolvedValue([mockPost]);

    const request = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Post',
        content: 'Test content',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.post).toEqual(mockPost);
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Post',
        content: 'Test content',
      })
    );
  });

  it('returns 400 for invalid data', async () => {
    const request = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        // Missing required fields
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(db.insert).mockRejectedValue(new Error('DB Error'));

    const request = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Post',
        content: 'Test content',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
```

### 5. E2E Tests for Critical Flows

Use Playwright for critical user journeys only:

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up, verify email, and sign in', async ({ page }) => {
    // Sign up
    await page.goto('/signup');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verify redirect to check email page
    await expect(page).toHaveURL('/auth/verify');
    await expect(page.locator('text=Check your email')).toBeVisible();

    // Simulate email verification (in real test, use test email API)
    // Then sign in
    await page.goto('/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verify successful signin
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

### 6. Test Organization Patterns

#### Arrange-Act-Assert (AAA)
```typescript
it('creates a post with valid data', async () => {
  // Arrange
  const postData = {
    title: 'Test Post',
    content: 'Test content',
  };

  // Act
  const result = await createPost(postData);

  // Assert
  expect(result).toMatchObject(postData);
  expect(result.id).toBeDefined();
});
```

#### Given-When-Then (BDD style)
```typescript
it('creates a post with valid data', async () => {
  // Given a valid post payload
  const postData = {
    title: 'Test Post',
    content: 'Test content',
  };

  // When creating the post
  const result = await createPost(postData);

  // Then it should be created successfully
  expect(result).toMatchObject(postData);
  expect(result.id).toBeDefined();
});
```

### 7. Mock External Dependencies

Always mock external services, databases, and APIs in unit/integration tests:

```typescript
import { vi } from 'vitest';

// Mock database
vi.mock('@/lib/db', () => ({
  query: {
    posts: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
    })),
  })),
}));
```

### 8. Test Edge Cases and Errors

Don't just test the happy path:

```typescript
describe('calculateDiscount', () => {
  it('calculates discount correctly', () => {
    expect(calculateDiscount(100, 0.2)).toBe(20);
  });

  it('handles zero amount', () => {
    expect(calculateDiscount(0, 0.2)).toBe(0);
  });

  it('handles zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(0);
  });

  it('throws error for negative amounts', () => {
    expect(() => calculateDiscount(-100, 0.2)).toThrow('Amount must be positive');
  });

  it('throws error for invalid discount rates', () => {
    expect(() => calculateDiscount(100, 1.5)).toThrow('Discount rate must be between 0 and 1');
  });

  it('handles floating point precision', () => {
    expect(calculateDiscount(10.99, 0.1)).toBeCloseTo(1.099, 2);
  });
});
```

## Examples

### Good Examples

#### Well-Structured Unit Test
```typescript
// lib/services/postService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostService } from './postService';
import * as db from '@/lib/db';

vi.mock('@/lib/db');

describe('PostService', () => {
  let service: PostService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PostService();
  });

  describe('createPost', () => {
    it('creates post with valid data', async () => {
      const postData = {
        title: 'Test',
        content: 'Content',
        userId: 'user-1',
      };

      vi.mocked(db.insert).mockResolvedValue([{ id: '123', ...postData }]);

      const result = await service.createPost(postData);

      expect(result.id).toBe('123');
      expect(result.title).toBe('Test');
    });

    it('validates required fields', async () => {
      await expect(
        service.createPost({ title: '', content: 'Content', userId: 'user-1' })
      ).rejects.toThrow('Title is required');
    });

    it('sanitizes user input', async () => {
      const postData = {
        title: '<script>alert("xss")</script>',
        content: 'Content',
        userId: 'user-1',
      };

      vi.mocked(db.insert).mockResolvedValue([{ id: '123', ...postData }]);

      const result = await service.createPost(postData);

      expect(result.title).not.toContain('<script>');
    });
  });

  describe('getPost', () => {
    it('returns post by id', async () => {
      const mockPost = {
        id: '123',
        title: 'Test',
        content: 'Content',
      };

      vi.mocked(db.query.posts.findFirst).mockResolvedValue(mockPost);

      const result = await service.getPost('123');

      expect(result).toEqual(mockPost);
    });

    it('returns null for non-existent post', async () => {
      vi.mocked(db.query.posts.findFirst).mockResolvedValue(null);

      const result = await service.getPost('999');

      expect(result).toBeNull();
    });
  });
});
```

#### Focused E2E Test
```typescript
// e2e/post-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Post Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login (assuming auth is already tested)
    await page.goto('/signin');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('user can create and view a post', async ({ page }) => {
    // Navigate to create post
    await page.click('text=Create Post');
    await expect(page).toHaveURL('/posts/new');

    // Fill form
    await page.fill('[name="title"]', 'My First Post');
    await page.fill('[name="content"]', 'This is my post content');
    await page.click('button:has-text("Publish")');

    // Verify redirect to post view
    await expect(page).toHaveURL(/\/posts\/[a-z0-9-]+/);
    await expect(page.locator('h1')).toHaveText('My First Post');
    await expect(page.locator('article')).toContainText('This is my post content');

    // Verify post appears in list
    await page.goto('/posts');
    await expect(page.locator('text=My First Post')).toBeVisible();
  });

  test('shows validation errors for invalid input', async ({ page }) => {
    await page.goto('/posts/new');

    // Submit without filling fields
    await page.click('button:has-text("Publish")');

    // Verify error messages
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Content is required')).toBeVisible();
  });
});
```

### Bad Examples

```typescript
// ❌ No test organization or context
it('works', () => {
  expect(calculateDiscount(100, 0.2)).toBe(20);
});

// ❌ Testing implementation details instead of behavior
it('calls database with correct query', () => {
  const spy = vi.spyOn(db, 'query');
  service.getPosts();
  expect(spy).toHaveBeenCalledWith('SELECT * FROM posts');
  // Should test the result, not the query!
});

// ❌ Too many assertions in one test
it('post service works correctly', async () => {
  const post = await service.createPost({ title: 'Test' });
  expect(post.id).toBeDefined();

  const fetched = await service.getPost(post.id);
  expect(fetched).toEqual(post);

  await service.updatePost(post.id, { title: 'Updated' });
  const updated = await service.getPost(post.id);
  expect(updated.title).toBe('Updated');

  await service.deletePost(post.id);
  const deleted = await service.getPost(post.id);
  expect(deleted).toBeNull();
  // Split into separate tests!
});

// ❌ Not mocking external dependencies
it('creates post in database', async () => {
  // This will hit the real database!
  const post = await db.insert(posts).values({ title: 'Test' });
  expect(post.id).toBeDefined();
});

// ❌ E2E test for unit-testable logic
test('currency formatting works', async ({ page }) => {
  await page.goto('/test-page');
  const result = await page.evaluate(() => formatCurrency(1234.56));
  expect(result).toBe('$1,234.56');
  // Should be a unit test!
});
```

## Integration Points

This skill is automatically applied by:
- **feature-builder agent** - When implementing features (step 4)
- **test-validator agent** - Validates test coverage and quality

## Checklist

When applying this skill, verify:
- [ ] Unit tests exist for all business logic
- [ ] Tests are colocated with source files
- [ ] Tests follow AAA or Given-When-Then pattern
- [ ] External dependencies are mocked
- [ ] Edge cases and error conditions are tested
- [ ] Integration tests cover component interactions
- [ ] E2E tests only cover critical user flows
- [ ] Test descriptions clearly explain what is being tested
- [ ] Tests are isolated and don't depend on each other
- [ ] All tests pass before committing

## Test Coverage Goals

Aim for:
- **Unit tests**: 80%+ coverage of business logic
- **Integration tests**: Cover all API routes and database interactions
- **E2E tests**: Cover 3-5 critical user flows

Don't chase 100% coverage - focus on testing behavior, not lines of code.

## Common Patterns

### Testing Async Functions
```typescript
it('handles async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### Testing Error Handling
```typescript
it('throws error for invalid input', async () => {
  await expect(functionThatThrows()).rejects.toThrow('Error message');
});
```

### Testing with Timers
```typescript
import { vi } from 'vitest';

it('executes after delay', async () => {
  vi.useFakeTimers();

  const callback = vi.fn();
  delayedFunction(callback, 1000);

  vi.advanceTimersByTime(1000);

  expect(callback).toHaveBeenCalled();

  vi.useRealTimers();
});
```

## Related Skills

- **idempotent-migrations** - Test migrations run twice without errors
- **rls-security-patterns** - Test RLS policies in integration tests
- **nextjs-cache-patterns** - Test cache invalidation

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
