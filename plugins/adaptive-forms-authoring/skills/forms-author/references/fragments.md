# Form Fragments — Authoring Reference

A Form Fragment is a self-contained, reusable section of a form (e.g., Personal Details, Address, Consent) stored as a separate JSON file and referenced by one or more host forms.

---

## When to Create a Fragment

Create a fragment when a panel meets **any** of these thresholds:

| Trigger | Threshold |
|---------|-----------|
| **Reusability** | Section appears in 2+ forms |
| **Complexity** | Panel has 10+ fields OR complex logic that clutters the main form |
| **Standardization** | Regulatory text or layout that must be identical across the org |
| **Maintenance** | Section changes frequently and propagation must be instant |
| **Collaboration** | Different teams need to edit this section independently |

If none apply, keep the panel inline in the host form.

---

## Repository Structure

Fragments are separate JSON files in the same GitHub repo as the host form. Both **must** be in the same repository and branch.

```
/forms
  loan-application.json       ← host form (contains fragment reference)
  personal-details.json       ← fragment file (contains actual fields)
```

The fragment file holds the full panel definition (fields, rules, data binding). The host form holds a lightweight `form-fragment` reference component pointing to it.

---

## Authoring Workflow

### 1. Create the Fragment

In Universal Editor on AEM Author:
- Create a new form or open an existing panel
- Convert the panel to a fragment **or** create a new fragment directly
- Give it a unique, descriptive name with no spaces (e.g., `personal-details`, `address-section`)

### 2. Sync to GitHub

```bash
git add forms/<fragment-name>.json
git commit -m "feat: add <fragment-name> fragment"
git push
```

### 3. Reference in Host Form

In the host form (via forms-author + Sites Content MCP):
- Add a `form-fragment` component at the panel location
- Set its `fragmentPath` property to point to the fragment JSON

### 4. Preview and Verify

Test in Preview Mode — updates to the fragment must propagate to all host forms automatically.

---

## Configuration

### Lazy Loading

Enable for large fragments to defer loading until the user navigates to that step:
- Set `lazyLoad: true` on the `form-fragment` component
- Improves initial form load performance

### Global Values

If a field inside a lazy-loaded fragment is needed by rules in **other** parts of the form:
- Mark that field as `useGlobally: true`
- Keeps the value available even when the fragment is unloaded from DOM

---

## Data Binding

Always bind fragment fields to the same Form Data Model (FDM) or JSON Schema as the host form. Mismatched schemas cause submit payload gaps.

---

## Guard Rails

| Rule | Reason |
|------|--------|
| Same repo + branch as host form | AEM cannot resolve cross-repo fragment refs |
| Unique descriptive names (no spaces) | Rule editor references break on ambiguous names |
| No Verify component inside fragments | Causes rendering issues when reused |
| No cross-fragment scripting | Fragments must be self-contained |
| No server-side overlays or packages | EDS fragments are flat JSON files only |
| Lazy load large fragments | Improves initial performance |

---

## Fragment vs Inline Panel — Decision

```
Does this panel appear in 2+ forms?          → Fragment
Does it have 10+ fields?                     → Fragment
Is it regulatory/must be org-consistent?     → Fragment
Does it change frequently (legal, consent)?  → Fragment
Otherwise                                    → Keep inline
```
