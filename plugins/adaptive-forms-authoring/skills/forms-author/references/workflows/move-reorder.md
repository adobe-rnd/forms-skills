# Move / Reorder Field Workflow

Requires two round-trips — the eTag changes after the remove.

1. Fetch `get-aem-page-content` → CONTENT_MODEL + eTag1
2. Run `find-field(sourceField)` → sourcePointer, component, oldQualifiedId
3. Run `find-field(targetField)` → targetPanel capiKey
4. Call `patch-aem-page-content(eTag1, [{ op: "remove", path: sourcePointer }])`
5. Fetch `get-aem-page-content` → new CONTENT_MODEL + eTag2 ← required eTag refresh
6. Run `resolve-insert-position` in new CONTENT_MODEL → targetPointer
7. Call `patch-aem-page-content(eTag2, [{ op: "add", path: targetPointer, value: component }])`
8. Fetch `get-aem-page-content` → POST-MOVE CONTENT_MODEL + eTag3
9. Run `find-field(sourceField)` in POST-MOVE → newQualifiedId

If `oldQualifiedId !== newQualifiedId` (field moved to different panel) — run rule migration from `references/workflows/rename-field.md` step 9 onwards, treating old/new qualifiedId as old/new id.
