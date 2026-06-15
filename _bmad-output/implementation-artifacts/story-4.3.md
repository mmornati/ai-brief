# Story 4.3: Google Slides Connector

Status: ready-for-dev

## Story

As a user,
I want to publish slide decks to an existing Google Slides presentation,
so that my content appears in Google Slides without manual copy-paste.

## Acceptance Criteria

1. **Full publish flow** — Given the pipeline produces a slide deck (`--format slides`), when I run with `--publish google-slides`, then the connector authenticates via Google service account, reads the existing presentation by ID, clears all existing slides, creates a title slide with the deck title, creates one slide per `##` heading in the Marp output, adds text content to each slide, sets speaker notes from `<!-- speaker: -->` comments, and outputs a success message with the presentation URL.

2. **Presentation ID from env** — Given the config has `"presentationId": "env:GOOGLE_SLIDES_PRESENTATION_ID"`, when the connector runs, then it reads the presentation ID from the environment variable and throws a clear error if it's not set.

3. **Credentials file missing** — Given the credentials file (`~/.config/ai-brief/google-credentials.json`) does not exist, when the connector runs, then it throws a descriptive error with instructions to create a service account and download the key.

4. **API error handling** — Given the presentation ID is invalid or access is denied, when the connector attempts to update, then it throws a descriptive error with the HTTP status and response body.

5. **Config validation** — Given the connector is loaded with invalid config, when `validateConfig()` is called, then it returns `{ valid: false, errors: [...] }` with specific missing fields.

6. **Speaker notes mapping** — Given a slide has `<!-- speaker: Key point here -->`, when the connector creates that slide, then the speaker notes text "Key point here" is set on the corresponding slide via the Slides API notes page.

## Tasks / Subtasks

- [ ] Create `src/services/google-slides.js` extending `ServicePublisher` (AC: 1-6)
  - [ ] `validateConfig()` — check presentationId and credentialsPath are resolvable
  - [ ] `publish(localFilePath, content, metadata)` — main publish flow:
    - [ ] Resolve credentials path, load service account JSON key
    - [ ] Init GoogleAuth with `https://www.googleapis.com/auth/presentations` scope
    - [ ] GET current presentation to list existing slide objectIds
    - [ ] Parse local Marp file: extract title slide, body slides, speaker notes
    - [ ] Batch delete all existing slides
    - [ ] Create title slide with deck title
    - [ ] Create one slide per `##` heading + body content
    - [ ] For each slide: create text box shapes, insert content text
    - [ ] For each slide with speaker notes: write notes via insertText on notes page
    - [ ] Print success: `Published to https://docs.google.com/presentation/d/{id}/edit`
  - [ ] Error handling for 401/403/404 HTTP responses
- [ ] Add `google-auth-library` dependency to `package.json` (AC: 1)
- [ ] Create `test/services/google-slides.test.js` (AC: 2-6)
  - [ ] Mock Google Slides API responses using `vi.mock` or fetch interception
  - [ ] Test credential file not found
  - [ ] Test missing env var
  - [ ] Test API error handling
  - [ ] Test Marp markdown parsing (extract slides, headings, speaker notes)
  - [ ] Test config validation

## Dev Notes

### Google Slides API v1 — REST Endpoints

```
GET    https://slides.googleapis.com/v1/presentations/{presentationId}
POST   https://slides.googleapis.com/v1/presentations/{presentationId}:batchUpdate
```

### Auth — Service Account with `google-auth-library`

```js
import { JWT } from 'google-auth-library';

const keyFile = JSON.parse(await readFile(credentialsPath, 'utf-8'));
const client = new JWT({
  email: keyFile.client_email,
  key: keyFile.private_key,
  scopes: ['https://www.googleapis.com/auth/presentations'],
});
await client.authorize();
// Use client.credentials.access_token for bearer auth
// OR pass client directly to fetch calls
```

### batchUpdate Request Sequence

For each publish, send one `batchUpdate` with multiple requests in order:

1. **Delete existing slides** — one `deleteObject` per slide objectId
2. **Create title slide** — `createSlide` with `insertionIndex: 0`, `predefinedLayout: "TITLE"`
3. **Create body slides** — `createSlide` per `##` heading section
4. **Create text boxes** — `createShape` with `shapeType: "TEXT_BOX"` on each slide
5. **Insert text** — `insertText` into each text box
6. **Set speaker notes** — `insertText` on notes page's `speakerNotesObjectId`

Note: You may need multiple batchUpdate calls if the request count gets large (API limit ~1000 requests per call). For typical decks (10-30 slides), one call suffices.

### Marp Markdown Parsing Rules

The local file at `localFilePath` is a Marp-compatible markdown:

```markdown
# Deck Title
Content before first H2...

---

## Slide 1 Title
Bullet point 1
Bullet point 2
<!-- speaker: Note for slide 1 -->

---

## Slide 2 Title
More content
<!-- speaker: Note for slide 2 -->
```

Parsing algorithm:
1. Strip the Marp YAML header (between `---` delimiters at top, if marp: true present)
2. Split content on `---` slide separators
3. First slide = title slide (content before first `##`)
4. Remaining slides — each starts with `##` heading = slide title
5. Extract `<!-- speaker: text -->` from each slide, remove from content
6. Body text = remaining lines after removing heading and speaker notes

### Slide Layout Strategy

- Title slide: use `predefinedLayout: "TITLE"`, set title text via placeholder
  - Or use BLANK layout and create a large centered text box
- Body slides: use `predefinedLayout: "BLANK"`, create:
  - Title text box at top (width: full, height: ~50pt, position: top)
  - Body text box below (width: full, height: remaining space)
- Keep it simple — one text box for title, one for body per slide

### Text Styling

Not required for v1 — plain text is acceptable. The `insertText` request with no `style` sends unstyled text that inherits the slide layout defaults.

### Error Handling

- 401/403: `throw new Error(`Google Slides auth failed: ${status}. Check credentials at ${credentialsPath} and ensure the service account has editor access to the presentation.`)`
- 404: `throw new Error(`Presentation ${presentationId} not found. Check GOOGLE_SLIDES_PRESENTATION_ID is correct.`)`
- Network: wrap with `Network error connecting to Google Slides API: ${err.message}`
- All errors should include the presentation ID (masked if sensitive) for debugging

### File Impact

| File | Change |
|------|--------|
| `src/services/google-slides.js` | NEW — Google Slides connector |
| `package.json` | MODIFY — add `google-auth-library` dependency |
| `test/services/google-slides.test.js` | NEW — test suite |

### Existing Patterns to Follow

- Extend `ServicePublisher` from `src/services/base.js` (created in Story 4.2)
- Path helpers from `src/utils/paths.js` and `src/utils/file.js`
- Error message convention: start with connector name `"GoogleSlides: {message}"`

### Dependencies

- `google-auth-library` (npm) — ~200KB, handles JWT auth lifecycle, token refresh
- Node.js native `fetch` (18+) — for REST API calls, no extra HTTP library needed
- No `googleapis` mega-package — direct REST calls are simpler and lighter

### Testing

- Mock `fetch` globally with `vi.stubGlobal('fetch', mockFn)` or use `vitest-fetch-mock`
- For auth: mock `google-auth-library` JWT client's `authorize()` and `credentials.access_token`
- Test fixtures: create sample Marp output files in `test/fixtures/sample-slides.md`
- Test parsing separately from API calls

## References

- [Source: architecture-addendum-linked-services.md#ADR-LS-5] Google Slides strategy
- [Source: architecture-addendum-linked-services.md#L76-L80] API approach summary
- [Source: research: Google Slides API v1] REST endpoints, batchUpdate, auth, speaker notes
- [Source: src/services/base.js] ServicePublisher base class

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD