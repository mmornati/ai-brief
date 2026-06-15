# Story 4.4: Hashnode Connector

Status: ready-for-dev

## Story

As a user,
I want to publish blog posts to Hashnode as drafts,
so that I can review and publish from the Hashnode dashboard.

## Acceptance Criteria

1. **Full publish flow** — Given the pipeline produces a blog post (`--format blog`), when I run with `--publish hashnode`, then the connector authenticates via Hashnode API key, parses YAML frontmatter for `title` and `tags`, creates a draft post on the configured publication via Hashnode GraphQL API, and outputs a success message with the draft URL.

2. **Title from frontmatter** — Given the blog has frontmatter with `title: My Post`, when the connector creates the draft, then the title is set to "My Post".

3. **Tags from frontmatter** — Given the blog has frontmatter with `tags: ["javascript", "node"]`, when the connector creates the draft, then tags are included in the API request.

4. **Body is frontmatter-stripped markdown** — Given the blog file has YAML frontmatter followed by markdown body, when the connector creates the draft, then the body is the markdown content with frontmatter stripped.

5. **Draft mode** — When the connector creates the post, the post is created as a draft (not published).

6. **Missing API key** — Given `HASHNODE_API_KEY` env var is not set, when the connector runs, then it throws a descriptive error with instructions to create a Hashnode PAT.

7. **API error handling** — Given the API returns an error response, when the connector receives it, then it throws a descriptive error with the API error details.

8. **Config validation** — Given the connector is loaded with invalid config, when `validateConfig()` is called, then it returns `{ valid: false, errors: [...] }` with specific missing fields.

## Tasks / Subtasks

- [ ] Create `src/services/hashnode.js` extending `ServicePublisher` (AC: 1-8)
  - [ ] `validateConfig()` — check apiKey and publicationId are resolvable
  - [ ] `publish(localFilePath, content, metadata)` — main publish flow:
    - [ ] Read local blog file
    - [ ] Parse YAML frontmatter for `title`, `tags`
    - [ ] Strip frontmatter to get body markdown
    - [ ] Authenticate via Authorization header with API key
    - [ ] Send GraphQL mutation to create draft post
    - [ ] Parse response for post URL
    - [ ] Print success: `Published draft to https://{publication-domain}/{slug}`
  - [ ] Error handling for 401/400/500 HTTP responses
- [ ] Create `test/services/hashnode.test.js` (AC: 2-8)
  - [ ] Mock GraphQL API responses
  - [ ] Test frontmatter parsing (title, tags, body extraction)
  - [ ] Test missing env var
  - [ ] Test API error handling
  - [ ] Test config validation
  - [ ] Test YAML edge cases (no tags, multiline title, etc.)

## Dev Notes

### Hashnode GraphQL API

**Note:** As of May 2026, Hashnode gated the GraphQL API behind a Pro subscription. The old `api.hashnode.com` endpoint is dead. The connector targets the current v2 endpoint `https://gql.hashnode.com/` and will work only for publications with an active Hashnode Pro plan.

### Endpoint & Auth

```
POST https://gql.hashnode.com/
Headers:
  Content-Type: application/json
  Authorization: {HASHNODE_API_KEY}
```

### GraphQL Mutation

```graphql
mutation createStory($input: CreateStoryInput!) {
  createStory(input: $input) {
    code
    success
    message
    post {
      id
      title
      slug
      url
    }
  }
}
```

### Variables

```json
{
  "input": {
    "title": "Post Title",
    "contentMarkdown": "# Body markdown here",
    "tags": [{ "slug": "javascript", "name": "JavaScript" }],
    "publicationId": "PUBLICATION_ID",
    "draft": true
  }
}
```

### Frontmatter Parsing

Use simple regex-based YAML parsing — no external dependency needed for v1:

```js
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { title: 'Untitled', tags: [], body: content };

  const yaml = match[1];
  const body = match[2].trim();

  const titleMatch = yaml.match(/^title:\s*"(.+?)"/m) || yaml.match(/^title:\s*(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  const tagsMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m) || yaml.match(/^tags:\n((?:\s+-\s*["']?.+["']?\n?)+)/m);
  let tags = [];
  if (tagsMatch) {
    if (tagsMatch[1].includes(',')) {
      tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean);
    } else {
      tags = tagsMatch[1].match(/["']?(\w+)["']?/g)?.map(t => t.trim().replace(/['"]/g, '')) || [];
    }
  }

  return { title, tags, body };
}
```

### Tag Format Conversion

Hashnode API expects tags as `[{ slug, name }]` objects. Convert frontmatter tag strings:

```js
function tagsToHashnodeFormat(tags) {
  return tags.map(tag => ({
    slug: tag.toLowerCase().replace(/\s+/g, '-'),
    name: tag,
  }));
}
```

### Error Handling

- 401: `throw new Error(`Hashnode auth failed: invalid API key. Generate a PAT at https://hashnode.com/account/settings`)`
- 400 (GraphQL error): `throw new Error(`Hashnode API error: ${body.errors[0].message}`)`
- Network: `throw new Error(`Network error connecting to Hashnode: ${err.message}`)`
- Response with `success: false`: throw with the message field

### No External Dependencies

- Use Node.js native `fetch` (18+) — no npm package needed
- Frontmatter parsing: regex-based, no `js-yaml` dependency needed for v1

### File Impact

| File | Change |
|------|--------|
| `src/services/hashnode.js` | NEW — Hashnode connector |
| `test/services/hashnode.test.js` | NEW — test suite |

### Existing Patterns to Follow

- Extend `ServicePublisher` from `src/services/base.js` (created in Story 4.2)
- Frontmatter parsing can reference patterns in `src/formats/blog.js`
- Error message convention: start with connector name `"Hashnode: {message}"`

### Testing

- Create a sample blog file fixture in `test/fixtures/sample-blog.md` with frontmatter + body
- Mock `fetch` with `vi.stubGlobal` for API tests
- Test frontmatter parsing independently: title, tags (various formats), body extraction
- Test edge cases: no frontmatter, no tags, empty body
- Test missing env var with `vi.stubEnv`

## References

- [Source: architecture-addendum-linked-services.md#ADR-LS-6] Hashnode draft strategy
- [Source: architecture-addendum-linked-services.md#L86-L90] API approach summary
- [Source: research: Hashnode API] gql.hashnode.com, createStory mutation, draft mode, Pro requirement
- [Source: src/services/base.js] ServicePublisher base class
- [Source: src/formats/blog.js] Existing frontmatter generation (reverse for parsing)

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD