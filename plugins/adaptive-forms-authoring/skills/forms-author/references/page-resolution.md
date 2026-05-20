# Page Resolution

Run at the start of every forms-author workflow before any MCP read or write.

## Resolve pageId

### Step A — Search for the form page

1. Call `get-aem-pages` (or `search-aem-pages` if a keyword is available) to discover existing forms
2. If results are found → identify the most relevant page and propose it:

   > "I'll work on: `<title>` at `<path>`. Is this correct?"

   - User confirms → set `PAGE_ID` from `items[0].pageId` and proceed
   - User corrects → call `get-aem-pages(publishPath: "<corrected-path>")` → take `items[0].pageId`. If empty → STOP: *"No page found at `<path>`."*

### Step B — No pages found: search for a blank form page to copy (create form only)

If Step A returns no results and the operation is **create form**, do NOT ask the user yet. First search for an existing blank form **page** via MCP:

1. Call `get-aem-sites` to discover sites
2. For each site path returned (typically under `/content/forms/af/...`), first try `get-aem-pages(publishPath: "<sitePath>/blank-form")`
3. If that returns no results, inspect pages under the site path with `get-aem-pages(publishPath: "<sitePath>")` and look for a suitable blank form page to copy
4. If a blank form page is found → propose the best match:

   > "I found this blank form page: `<title>` at `<path>`. Shall I create the new form from this?"

   - User confirms → set `TEMPLATE_PAGE_ID` from the returned page's `pageId` and proceed to create-form workflow
   - User provides a different path → verify with `get-aem-pages(publishPath: "<path>")`. If empty → STOP: *"No blank form page found at `<path>`."*

5. If no blank form page is found via MCP → STOP and ask:

   > "No blank form pages were found on this AEM instance. Please provide the page path to copy from (e.g. `/content/forms/af/default-site/blank-form`)."

   Wait for user response. Verify: `get-aem-pages(publishPath: "<provided-path>")`. If empty → STOP: *"No blank form page found at `<path>`."*

### Step C — No pages found: ask the user (non-create operations)

If Step A returns no results and the operation is **not** create form → STOP and ask:

   > "No form pages were found via MCP. Please provide the path to the form you want to work with (e.g. `/content/forms/af/my-form`)."

   Wait for user response. Call `get-aem-pages(publishPath: "<path>")`. If empty → STOP: *"No page found at `<path>`."*

## eTag conflict (412)

1. Re-fetch `get-aem-page-content` → new eTag
2. Re-run `find-field` / `resolve-insert-position` against fresh content model (positions may have shifted)
3. Retry patch with new eTag
4. If 412 again — abort: *"Concurrent edit conflict. Please retry."*
