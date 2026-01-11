# RUM Distiller Facets Documentation

This document provides comprehensive documentation for all facets defined in `datachunks.js` for the rum-query skill. These facets are used to create filter objects for filtering Real User Monitoring (RUM) data from AEM Operational Telemetry.

## Overview

Facets are used to filter RUM bundles (page views). Each facet has a name that you use in filter objects. When filtering:
- Different facets are combined using logical AND (all must match)
- Multiple values for the same facet use the facet's combiner (`some` = any match, `every` = all match)
- Facets with negative support allow exclusion filters using `!facetName`

## Filter Object Structure

```javascript
// Set filter on dataChunks
dataChunks.filter = {
  "facetName": ["value1", "value2"],
  "anotherFacet": ["value"],
  "!negativeFacet": ["excludeThis"]  // Only for facets with negative support
};
```

---

## Available Facets

### 1. `url`
**Combiner**: `every` | **Negative Support**: ✅ Yes (`!url`)

**What it does**: Extracts the URL path from a bundle, sanitized to remove PII (IDs, hashes, encoded data).

**Filter Example**:
```javascript
dataChunks.filter = {
  url: ['/home', '/products', '/checkout']
};
// Matches bundles where URL is one of these paths
```

**Negative Filter Example**:
```javascript
dataChunks.filter = {
  '!url': ['/admin', '/test']
};
// Excludes admin and test pages
```

---

### 2. `userAgent`
**Combiner**: `some` | **Negative Support**: ✅ Yes (`!userAgent`)

**What it does**: Extracts device type (desktop/mobile/tablet) and OS (windows/ios/android/mac/linux).

**Filter Example**:
```javascript
dataChunks.filter = {
  userAgent: ['mobile', 'ios']
};
// Matches mobile devices OR iOS devices
```

**Negative Filter Example**:
```javascript
dataChunks.filter = {
  '!userAgent': ['bot']
};
// Excludes bot traffic
```

---

### 3. `checkpoint`
**Combiner**: `every` | **Negative Support**: ✅ Yes (`!checkpoint`)

**What it does**: Extracts checkpoint types (event names) that occur in a bundle.

**Common Checkpoints**: `enter`, `navigate`, `click`, `viewblock`, `viewmedia`, `loadresource`, `fill`, `error`, `lcp`, `cls`, `inp`, `ttfb`

**Filter Example**:
```javascript
dataChunks.filter = {
  checkpoint: ['click', 'fill']
};
// Matches bundles with click AND fill events
```

**Negative Filter Example**:
```javascript
dataChunks.filter = {
  '!checkpoint': ['error']
};
// Excludes bundles with errors
```

---

### 4. `navigate.source`
**Combiner**: `every` | **Negative Support**: ❌ No

**What it does**: Extracts the element/link that triggered navigation (CSS selector or identifier).

**Filter Example**:
```javascript
dataChunks.filter = {
  'navigate.source': ['.nav-menu a', '.cta-button']
};
// Matches bundles where navigation came from nav menu AND CTA button
```

---

### 5. `enter.source`
**Combiner**: `every` | **Negative Support**: ❌ No

**What it does**: Extracts the referrer (where users came from). Can be external domains or classifications like `search:google`.

**Filter Example**:
```javascript
dataChunks.filter = {
  'enter.source': ['google', 'facebook']
};
// Matches bundles from Google AND Facebook referrers
```

---

### 6. `loadresource.source`
**Combiner**: `some` | **Negative Support**: ❌ No

**What it does**: Identifies resources being loaded (CSS, JS, images).

**Note**: This facet is defined twice in datachunks.js with different combiners. The second definition (line 44) with `some` combiner is the active one.

**Filter Example**:
```javascript
dataChunks.filter = {
  'loadresource.source': ['/styles/main.css', '/scripts/app.js']
};
// Matches bundles loading main.css OR app.js
```

---

### 7. `click.source`
**Combiner**: `some` | **Negative Support**: ❌ No

**What it does**: Extracts CSS selectors of clicked elements.

**Filter Example**:
```javascript
dataChunks.filter = {
  'click.source': ['.buy-button', '.add-to-cart', '.checkout-btn']
};
// Matches bundles with clicks on ANY of these elements
```

---

### 8. `click.target`
**Combiner**: `some` | **Negative Support**: ❌ No

**What it does**: Extracts destinations of clicks (href values, URLs).

**Filter Example**:
```javascript
dataChunks.filter = {
  'click.target': ['/checkout', '/cart', 'https://external-site.com']
};
// Matches bundles with clicks leading to ANY of these destinations
```

---

### 9. `viewblock.source`
**Combiner**: `every` | **Negative Support**: ❌ No

**What it does**: Extracts names/identifiers of content blocks that were viewed.

**Filter Example**:
```javascript
dataChunks.filter = {
  'viewblock.source': ['hero', 'features']
};
// Matches bundles where hero AND features blocks were viewed
```

---

### 10. `fill.source`
**Combiner**: `some` | **Negative Support**: ❌ No

**What it does**: Extracts CSS selectors of form fields that were filled.

**Filter Example**:
```javascript
dataChunks.filter = {
  'fill.source': ['input[name="email"]', 'input[name="phone"]']
};
// Matches bundles with email OR phone fields filled
```

---

### 11. `error`
**Combiner**: `some` | **Negative Support**: ✅ Yes (`!error`)

**What it does**: Extracts error details combining both source (location) and target (message) in format "source | target".

**Filter Example**:
```javascript
dataChunks.filter = {
  error: ['/scripts/main.js | TypeError', '/scripts/analytics.js | Network Error']
};
// Matches bundles with errors from specific scripts and error types
```

**Negative Filter Example**:
```javascript
dataChunks.filter = {
  '!error': ['/scripts/non-critical.js | Warning']
};
// Excludes specific errors from non-critical script
```

**Note**: Values are in format "errorSource | errorTarget". Use `--facet-values error` to discover actual error combinations in your data.

---

### 12. `viewmedia.target`
**Combiner**: `some` | **Negative Support**: ❌ No

**What it does**: Extracts URLs of viewed media (images/videos), cleaned of query parameters.

**Filter Example**:
```javascript
dataChunks.filter = {
  'viewmedia.target': ['/images/hero.jpg', '/videos/demo.mp4']
};
// Matches bundles where these media files were viewed
```

---

## Understanding Combiners

Each facet uses a combiner strategy that determines how multiple filter values are matched:

- **`some`** (OR logic): Bundle matches if it satisfies **ANY** of the filter values
- **`every`** (AND logic): Bundle matches only if it satisfies **ALL** filter values

**Examples**:
```javascript
// 'some' combiner - matches if ANY value matches
dataChunks.filter = {
  'click.target': ['/checkout', '/cart']  // click goes to /checkout OR /cart
};

// 'every' combiner - matches if ALL values match
dataChunks.filter = {
  'viewblock.source': ['hero', 'features']  // hero AND features were viewed
};
```

**Important**: When combining different facets, they use AND logic:
```javascript
dataChunks.filter = {
  userAgent: ['mobile'],           // mobile OR tablet (some)
  checkpoint: ['click', 'fill'],   // click AND fill (every)
  url: ['/checkout']               // /checkout (every)
};
// Matches: (mobile) AND (click AND fill) AND (/checkout)
```

---

## Common Filter Patterns

### Pattern 1: Mobile users who clicked conversion buttons
```javascript
dataChunks.filter = {
  userAgent: ['mobile'],
  'click.source': ['.buy-button', '.add-to-cart', '.checkout-btn']
};
// Matches: mobile users who clicked ANY conversion button
```

### Pattern 2: Form interactions without errors
```javascript
dataChunks.filter = {
  checkpoint: ['fill'],
  '!checkpoint': ['error']
};
// Matches: bundles with form fills AND no errors
```

### Pattern 3: Specific page engagement
```javascript
dataChunks.filter = {
  url: ['/products/shoes'],
  checkpoint: ['viewblock', 'click', 'viewmedia']
};
// Matches: /products/shoes with viewblock AND click AND viewmedia
```

### Pattern 4: Traffic source analysis
```javascript
dataChunks.filter = {
  'enter.source': ['search:google', 'social:facebook']
};
// Matches: visits from Google search AND Facebook
```

### Pattern 5: Error monitoring on checkout
```javascript
dataChunks.filter = {
  url: ['/checkout', '/payment'],
  checkpoint: ['error'],
  error: ['/scripts/payment.js | TypeError', '/scripts/payment.js | Network Error']
};
// Matches: checkout/payment pages with specific errors from payment script
```

### Pattern 6: Content block engagement
```javascript
dataChunks.filter = {
  'viewblock.source': ['hero', 'features', 'testimonials'],
  'click.source': ['.cta-button']
};
// Matches: viewed ALL three blocks AND clicked CTA
```

### Pattern 7: Media interaction tracking
```javascript
dataChunks.filter = {
  'viewmedia.target': ['/images/product-hero.jpg'],
  'click.target': ['/products/details']
};
// Matches: viewed product image OR clicked to details page
```

### Pattern 8: Exclude bot traffic and test pages
```javascript
dataChunks.filter = {
  '!userAgent': ['bot'],
  '!url': ['/test', '/staging']
};
// Excludes: bots and test/staging pages
```

---

## Quick Reference: Facets by Category

### Page & Device
- `url` - Page paths (every, negative ✅)
- `userAgent` - Device type & OS (some, negative ✅)

### Events
- `checkpoint` - Event types (every, negative ✅)

### Navigation & Traffic
- `navigate.source` - Navigation triggers (every)
- `enter.source` - Referrers/traffic sources (every)

### Resources
- `loadresource.source` - Loaded resources (some)

### User Interactions
- `click.source` - Clicked elements (some)
- `click.target` - Click destinations (some)
- `viewblock.source` - Viewed content blocks (every)
- `viewmedia.target` - Viewed media (some)
- `fill.source` - Filled form fields (some)

### Errors
- `error` - Error details (source | target) (some, negative ✅)

---

## Best Practices for Creating Filters

1. **Understand Combiners**: Know whether your facet uses `some` (OR) or `every` (AND) logic
2. **Use Negative Facets**: Only 4 facets support negatives: `url`, `userAgent`, `checkpoint`, `error`
3. **Combine Facets**: Different facets are AND'ed together for precise targeting
4. **Check Checkpoint First**: Use `checkpoint` to verify events exist before filtering by their source/target
5. **Consider Performance**: Broad filters process faster; start general then refine
6. **Remember Weights**: Bundles have sampling weights; use totals for accurate metrics

---

## Checkpoint Reference

Common checkpoint types and their source/target meanings:

| Checkpoint | Source | Target | Facet Format |
|------------|--------|--------|--------------|
| `enter` | Referrer URL | - | enter.source |
| `navigate` | Navigation element | - | navigate.source |
| `click` | CSS selector of element | href/destination | click.source / click.target |
| `viewblock` | Block identifier | - | viewblock.source |
| `viewmedia` | - | Media URL | viewmedia.target |
| `loadresource` | Resource URL | - | loadresource.source |
| `fill` | Form field selector | - | fill.source |
| `error` | Error location/script | Error message/type | error (combined as "source \| target") |
| `lcp` | LCP element | - | - |
| `cls` | - | CLS value | - |
| `inp` | - | INP value | - |

---

## Related Documentation

- **AEM Operational Telemetry**: https://www.aem.live/docs/operational-telemetry
- **Checkpoint Details**: https://www.aem.live/developer/operational-telemetry
- **RUM Distiller README**: https://github.com/adobe/rum-distiller/blob/main/README.md
- **RUM Distiller API**: https://github.com/adobe/rum-distiller/blob/main/API.md

---

## Summary

This skill defines **12 facets** for filtering RUM data:
- **4 basic facets**: url, userAgent, checkpoint, error
- **8 checkpoint-specific facets**: navigate.source, loadresource.source, click.source, click.target, viewblock.source, fill.source, viewmedia.target

**Facets with negative support** (can use `!facetName`): url, userAgent, checkpoint, error

**To filter data**: Set `dataChunks.filter` to an object with facet names as keys and arrays of values to match.

