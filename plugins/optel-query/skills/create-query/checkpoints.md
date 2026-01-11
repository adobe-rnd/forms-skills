# AEM Operational Telemetry Checkpoints

This document provides comprehensive documentation for all checkpoints in AEM Operational Telemetry. Checkpoints are named events in the sequence of loading a page and interacting with it as a visitor.

## Overview

A **checkpoint** is a specific event type that occurs during a page view. Each checkpoint represents a measurable interaction or milestone in the user's experience. Checkpoints are collected as part of Real User Monitoring (RUM) bundles and can be used for:

- Performance analysis
- User behavior tracking
- Error monitoring
- Conversion tracking
- Content engagement analysis

## Data Structure

Every checkpoint event contains:
- **`checkpoint`**: The event name (lowercase, no special characters)
- **`source`**: The origin/element that triggered the event (optional, varies by checkpoint)
- **`target`**: The destination/object of the event (optional, varies by checkpoint)
- **`timeDelta`**: Milliseconds since page load
- **`value`**: Numeric value for metrics like Core Web Vitals (optional)

---

## Core Performance Checkpoints

### `top`
**Category**: Page Load | **Source**: N/A | **Target**: N/A

**What it tracks**: The page loading sequence has begun and first JavaScript code is being executed.

**When it fires**: Even before blocks are decorated or content is visible

**Use cases**:
- Track initial page load timing
- Measure time to interactive
- Identify slow-loading pages

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['top']
};
// All page views that started loading
```

---

### `cwv`
**Category**: Performance | **Source**: Metric type | **Target**: Metric value

**What it tracks**: Core Web Vitals (CWV) readiness or actual readings for LCP, CLS, or INP.

**When it fires**:
- When the page is ready to collect CWV readings
- When each CWV metric (LCP, CLS, INP) is recorded
- Multiple instances can occur during one page view (asynchronous)

**Use cases**:
- Monitor overall Core Web Vitals health
- Track when metrics become available
- Performance baseline establishment

**Note**: This is a meta-checkpoint. Use specific vitals checkpoints (lcp, cls, inp) for detailed analysis.

---

### `lcp`
**Category**: Performance | **Source**: LCP element selector | **Target**: N/A

**What it tracks**: Largest Contentful Paint - time for the largest contentful element to load.

**When it fires**: When the browser renders the most prominent content (usually the largest image)

**Performance thresholds**:
- **Good**: < 2.5 seconds
- **Needs Improvement**: 2.5 - 4.0 seconds
- **Poor**: > 4.0 seconds

**Use cases**:
- Optimize loading of hero images
- Identify slow-loading primary content
- A/B test content performance

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['lcp']
};
// Pages with LCP measurements
```

---

### `cls`
**Category**: Performance | **Source**: N/A | **Target**: CLS value

**What it tracks**: Cumulative Layout Shift - visual stability during page load.

**When it fires**: Throughout the page lifetime as layout shifts occur

**Performance thresholds**:
- **Good**: < 0.1
- **Needs Improvement**: 0.1 - 0.25
- **Poor**: > 0.25

**Use cases**:
- Identify pages with layout instability
- Fix elements causing unexpected shifts
- Improve user experience

---

### `inp`
**Category**: Performance | **Source**: N/A | **Target**: INP value

**What it tracks**: Interaction to Next Paint - responsiveness to user interactions.

**When it fires**: After user interactions (clicks, taps, keyboard inputs)

**Performance thresholds**:
- **Good**: < 200 ms
- **Needs Improvement**: 200 - 500 ms
- **Poor**: > 500 ms

**Use cases**:
- Identify laggy interactions
- Optimize JavaScript execution
- Improve perceived performance

**Note**: INP replaced FID (First Input Delay) as a Core Web Vital.

---

### `ttfb`
**Category**: Performance | **Source**: N/A | **Target**: TTFB value

**What it tracks**: Time to First Byte - server response time.

**When it fires**: When the first byte of the response arrives

**Performance thresholds**:
- **Good**: < 800 ms
- **Needs Improvement**: 800 - 1800 ms
- **Poor**: > 1800 ms

**Use cases**:
- Monitor server performance
- Identify backend bottlenecks
- CDN effectiveness analysis

---

## Navigation & Traffic Checkpoints

### `enter`
**Category**: Traffic Source | **Source**: Referrer URL | **Target**: N/A

**What it tracks**: How visitors arrive at the page (external referrers).

**Source values**:
- External domain URLs (e.g., `https://google.com`)
- `direct` - URL typed directly, bookmarks, or iOS app links
- Classified values like `search:google`, `social:facebook`

**Use cases**:
- Traffic source analysis
- Campaign attribution
- Referrer tracking
- Identify top external sources

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['enter'],
  'enter.source': ['search:google', 'social:facebook']
};
// Visits from Google search or Facebook
```

---

### `navigate`
**Category**: Navigation | **Source**: Navigation element/link | **Target**: N/A

**What it tracks**: Internal navigation paths between pages.

**When it fires**: When users click links to navigate within the site

**Use cases**:
- Discover internal navigation patterns
- Identify popular navigation paths
- Optimize site structure
- Track navigation from specific elements

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['navigate'],
  'navigate.source': ['.nav-menu', '.footer-links']
};
// Navigation from menu or footer
```

---

### `redirect`
**Category**: Navigation | **Source**: N/A | **Target**: Redirect count

**What it tracks**: Number of redirects (hops) to reach the destination URL.

**Use cases**:
- Identify excessive redirects
- Optimize redirect chains
- Improve page load performance

---

## User Interaction Checkpoints

### `click`
**Category**: Interaction | **Source**: CSS selector of clicked element | **Target**: href/destination URL

**What it tracks**: User clicks on any element (links, buttons, etc.).

**When it fires**: On any click event in the page

**Source**: CSS selector or element identifier (e.g., `.cta-button`, `#submit-btn`)
**Target**: The href value if the element is a link (e.g., `/checkout`, `https://external.com`)

**Use cases**:
- Track button/link clicks
- Identify popular UI elements
- Measure conversion actions
- Analyze user engagement

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['click'],
  'click.source': ['.buy-button', '.add-to-cart'],
  'click.target': ['/checkout']
};
// Clicks on purchase buttons leading to checkout
```

---

### `fill`
**Category**: Form Interaction | **Source**: CSS selector of form field | **Target**: N/A

**What it tracks**: Form fields filled by the user.

**When it fires**: When a user interacts with and fills a form field

**Source**: CSS selector of the field (e.g., `input[name="email"]`, `#phone-field`)

**Privacy**: The actual data entered is NOT captured

**Use cases**:
- Form field engagement analysis
- Identify form abandonment points
- Optimize form design
- Track which fields users interact with

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['fill'],
  'fill.source': ['input[name="email"]', 'input[name="phone"]']
};
// Email or phone fields filled
```

---

### `formsubmit`
**Category**: Form Interaction | **Source**: Form identifier/selector | **Target**: Form action URL

**What it tracks**: Form submissions.

**When it fires**: When a form is submitted

**Source**: Which form on the page was submitted
**Target**: The form's action URL (where data is sent)

**Use cases**:
- Track successful form submissions
- Measure conversion rates
- Identify which forms convert best
- Form completion analysis

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['formsubmit'],
  'formsubmit.target': ['/api/contact', '/api/signup']
};
// Contact or signup form submissions
```

---

### `search`
**Category**: Interaction | **Source**: Search query/field | **Target**: N/A

**What it tracks**: Site search performed by users.

**When it fires**: When a user performs a search using a search input field

**Use cases**:
- Track search usage
- Identify popular search terms
- Improve search functionality
- Content gap analysis

---

## Content Engagement Checkpoints

### `viewblock`
**Category**: Content Visibility | **Source**: Block class name/identifier | **Target**: N/A

**What it tracks**: Content blocks that scroll into view.

**When it fires**: When a block becomes visible in the viewport

**Source**: The class name of the block (e.g., `hero`, `features`, `testimonials`)

**Visibility threshold**: Block is at least partially visible

**Use cases**:
- Content engagement tracking
- Identify viewed vs ignored content
- Scroll depth analysis
- A/B test content effectiveness

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['viewblock'],
  'viewblock.source': ['hero', 'features', 'testimonials']
};
// Users who viewed all three blocks
```

---

### `viewmedia`
**Category**: Media Visibility | **Source**: N/A | **Target**: Media URL

**What it tracks**: Images or videos that scroll into view.

**When it fires**: When media becomes at least 25% visible in the browser

**Target**: URL of the image or video (cleaned of query parameters)

**Use cases**:
- Media engagement tracking
- Identify most viewed assets
- Optimize media loading
- Content performance analysis

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['viewmedia'],
  'viewmedia.target': ['/images/hero.jpg', '/videos/demo.mp4']
};
// Specific media viewed
```

---

## Resource Loading Checkpoints

### `loadresource`
**Category**: Resource Loading | **Source**: Resource URL | **Target**: N/A

**What it tracks**: Fragments and JSON API endpoints loaded for the site.

**When it fires**: When external resources are fetched

**Source**: URL of the loaded resource (CSS, JS, JSON, fragments)

**Use cases**:
- Track resource loading times
- Identify slow resources
- Monitor API call patterns
- Optimize resource loading

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['loadresource'],
  'loadresource.source': ['/fragments/header.json', '/api/products']
};
// Specific fragments or API endpoints loaded
```

---

## Error & Debugging Checkpoints

### `error`
**Category**: Error Tracking | **Source**: Error location/script | **Target**: Error message/type

**What it tracks**: Unhandled JavaScript errors.

**When it fires**: When a JavaScript error occurs and is not handled by application code

**Source**: Location or script where error occurred (e.g., `/scripts/main.js`, `inline`)
**Target**: Error message or type (e.g., `TypeError`, `ReferenceError`, `Network Error`)

**Use cases**:
- Bug tracking and monitoring
- Identify problematic scripts
- Error rate analysis
- Prioritize fixes by frequency

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['error'],
  error: ['/scripts/payment.js | TypeError', '/scripts/payment.js | Network Error']
};
// Specific errors in payment script (use --facet-values error to discover actual values)
```

---

### `404`
**Category**: Error Tracking | **Source**: N/A | **Target**: Missing URL

**What it tracks**: Page not found (404) responses.

**When it fires**: When a 404 error page is served

**Use cases**:
- Identify broken links
- Track missing content
- Monitor content migration issues
- SEO impact analysis

**Filter example**:
```javascript
dataChunks.filter = {
  checkpoint: ['404']
};
// All 404 errors
```

---

## Specialized Checkpoints

### `language`
**Category**: Localization | **Source**: Selected language | **Target**: N/A

**What it tracks**: Content languages used and user language preferences.

**Use cases**:
- Language preference analysis
- Localization effectiveness
- Multi-language site optimization

---

### `ally`
**Category**: Accessibility | **Source**: Feature detected | **Target**: N/A

**What it tracks**: Accessibility features detected on the site.

**Use cases**:
- Accessibility feature usage
- Compliance monitoring
- A11y optimization

---

### `consent`
**Category**: Privacy | **Source**: Consent action | **Target**: N/A

**What it tracks**: Consent provider enabled and user interactions.

**Use cases**:
- Consent banner effectiveness
- GDPR/CCPA compliance tracking
- User consent patterns

---

### `acquisition`
**Category**: Marketing | **Source**: Traffic source details | **Target**: N/A

**What it tracks**: Inorganic traffic sources (paid campaigns, ads).

**Use cases**:
- Campaign performance tracking
- Marketing attribution
- Paid vs organic analysis
- ROI measurement

---

## Checkpoint Categories Summary

| Category | Checkpoints |
|----------|-------------|
| **Performance** | top, cwv, lcp, cls, inp, ttfb |
| **Navigation** | enter, navigate, redirect |
| **User Interaction** | click, fill, formsubmit, search |
| **Content Engagement** | viewblock, viewmedia |
| **Resource Loading** | loadresource |
| **Errors** | error, 404 |
| **Specialized** | language, ally, consent, acquisition |

---

## Using Checkpoints in Filters

### Filter by specific checkpoints
```javascript
dataChunks.filter = {
  checkpoint: ['click', 'fill', 'formsubmit']
};
// Only bundles with ALL three events (combiner: 'every')
```

### Exclude checkpoints (negative filter)
```javascript
dataChunks.filter = {
  '!checkpoint': ['error', '404']
};
// Exclude bundles with errors or 404s
```

### Combine checkpoint with source/target
```javascript
dataChunks.filter = {
  checkpoint: ['click'],
  'click.source': ['.buy-button'],
  'click.target': ['/checkout']
};
// Buy button clicks going to checkout
```

### Multi-checkpoint engagement analysis
```javascript
dataChunks.filter = {
  checkpoint: ['viewblock', 'click', 'viewmedia'],
  'viewblock.source': ['hero', 'features'],
  url: ['/products']
};
// Product pages with high engagement
```

---

## Best Practices for Agents

1. **Start with checkpoint filter**: Always filter by checkpoint first to ensure events exist
2. **Understand source/target context**: Source and target meanings vary by checkpoint type
3. **Use performance checkpoints for metrics**: lcp, cls, inp, ttfb for performance analysis
4. **Combine for funnel analysis**: Track user journey with enter → viewblock → click → fill → formsubmit
5. **Monitor errors proactively**: Regular filters on error and 404 checkpoints
6. **Engagement scoring**: Count viewblock + viewmedia + click for engagement metrics
7. **Conversion tracking**: Follow click → fill → formsubmit sequence for conversions

---

## Related Documentation

- **Facets Documentation**: See `facets.md` for filtering by checkpoint source and target
- **AEM Operational Telemetry**: https://www.aem.live/docs/operational-telemetry
- **Developer Guide**: https://www.aem.live/developer/operational-telemetry
- **Core Web Vitals**: https://web.dev/vitals/

---

## Quick Reference Table

| Checkpoint | Has Source | Has Target | Primary Use Case |
|------------|------------|------------|------------------|
| top | ❌ | ❌ | Page load start |
| cwv | ✅ | ✅ | Core Web Vitals meta |
| lcp | ✅ | ❌ | Largest Contentful Paint |
| cls | ❌ | ✅ | Cumulative Layout Shift |
| inp | ❌ | ✅ | Interaction responsiveness |
| ttfb | ❌ | ✅ | Server response time |
| enter | ✅ | ❌ | Traffic sources |
| navigate | ✅ | ❌ | Internal navigation |
| redirect | ❌ | ✅ | Redirect tracking |
| click | ✅ | ✅ | User clicks |
| fill | ✅ | ❌ | Form field interactions |
| formsubmit | ✅ | ✅ | Form submissions |
| search | ✅ | ❌ | Site search |
| viewblock | ✅ | ❌ | Content block visibility |
| viewmedia | ❌ | ✅ | Media visibility |
| loadresource | ✅ | ❌ | Resource loading |
| error | ✅ | ✅ | JavaScript errors |
| 404 | ❌ | ✅ | Page not found |
| language | ✅ | ❌ | Language preferences |
| ally | ✅ | ❌ | Accessibility features |
| consent | ✅ | ❌ | Consent interactions |
| acquisition | ✅ | ❌ | Paid traffic sources |

