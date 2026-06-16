---
name: manage-apis
description: >
  Use when adding or documenting API integrations for a form — writing OpenAPI 3.0 specs,
  authoring JS API client files, or wiring external data sources from a cURL command.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.2"
  type: skill
  triggers:
    - api
    - apis
    - endpoint
    - fdm
    - form data model
    - add API
    - api integration
    - curl to api
---

# API Integration Skill

Manages API integrations for AEM Forms by authoring OpenAPI 3.0 YAML specs and JavaScript API client files directly.

## When to Use

- Adding a new API definition (from scratch or from a cURL command)
- Writing a JS API client file for use in custom functions
- Inspecting or listing existing API specs in `$FORMS_WORKSPACE/refs/apis/`
- Troubleshooting API integration issues in forms

**Do NOT use for:** Writing custom function logic that calls APIs — use the **forms-rule-author** skill instead (it covers custom function authoring, the async wrapper pattern, and `globals.functions.request()`).

## Critical Rules

1. **Always use `globals.functions.request()`** — NEVER use `fetch()` directly in AEM Forms
2. **Never fabricate API endpoints** — use only endpoints the user provides or that exist in `$FORMS_WORKSPACE/refs/apis/*.yaml`
3. **Write files directly** — author YAML specs and JS client files manually; no CLI tooling required

## Tools

| Action | How |
|--------|-----|
| Add API from cURL | `python3 scripts/api_skill.py --curl "<curl>" --repo-root "$FORMS_WORKSPACE"` |
| Add API manually | Write OpenAPI YAML to `$FORMS_WORKSPACE/refs/apis/<name>.yaml` using template below |
| List existing APIs | Read `$FORMS_WORKSPACE/refs/apis/*.yaml` files |
| Write JS client | Author `blocks/form/api-clients/<name>.js` using client pattern below |

## Workflow

1. **Discover** — read `$FORMS_WORKSPACE/refs/apis/*.yaml` to find existing API specs; ask user if none exist
2. **Add API spec** — if user provides a cURL, run `api_skill.py`; otherwise write YAML manually from template
3. **Write JS client** — author `blocks/form/api-clients/<name>.js` following the client pattern below
4. **Write custom function with response handler** — use **forms-rule-author** to create the custom function wrapper. The async helper MUST contain BOTH branches before the integration is considered done:
   - **Success branch** (`response.ok === true` or `x-success-condition` passes): maps `response.body` fields onto form fields via `globals.functions.setProperty`
   - **Error branch** (`response.ok === false` or condition fails): calls `globals.functions.markFieldAsInvalid` or sets an error panel visible — never silently swallows failures unless the spec explicitly says `On Error: silent`
   
   A custom function with a call but no response handler is **incomplete**. Do not mark the step done until both branches exist.
5. **Wire into form** — use **forms-author** to patch the rule into the form's content model

## OpenAPI YAML Template

Each API is defined as an OpenAPI 3.0 YAML file in `$FORMS_WORKSPACE/refs/apis/`:

```yaml
openapi: 3.0.3

info:
  title: API Name
  version: 1.0.0
  description: Brief description

x-aem-config:
  source: local                  # 'local' or 'aem-api-integration'
  executeAtClient: true
  encryptionRequired: false
  authType: None
  isOutputAnArray: false
  bodyStructure: requestString   # 'requestString', 'none', 'RequestPayload', or 'requestContext,requestData' for multi-root

paths:
  /api/endpoint.json:
    post:
      operationId: apiName
      summary: API Display Name
      parameters: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RequestBody'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Response'
      x-success-condition: response.body?.status?.responseCode === '0'

components:
  schemas:
    RequestBody:
      type: object
      properties:
        requestString:
          type: object
          required: [mobileNumber]
          properties:
            mobileNumber:
              type: string
    Response:
      type: object
      properties:
        status:
          type: object
          properties:
            responseCode:
              type: string
```

### Key Fields

| Field | Purpose |
|-------|---------|
| `x-aem-config.bodyStructure` | `"requestString"` wraps body in `{ requestString: {...} }`, `"none"` sends flat, `"RequestPayload"` or comma-separated names like `"requestContext,requestData"` for multi-root structures |
| `x-aem-config.source` | `"local"` for manual, `"aem-api-integration"` for synced |
| `x-success-condition` | JS expression to evaluate success from response |
| `operationId` | Becomes the exported function name in the JS client file |

## API Client Pattern

Write `async` JavaScript clients in `blocks/form/api-clients/<name>.js`:

```javascript
// <operationId> client — derived from $FORMS_WORKSPACE/refs/apis/<name>.yaml
export async function apiName(params, globals) {
  params = params || {};
  if (params.mobileNumber === undefined || params.mobileNumber === null) {
    throw new Error('apiName: mobileNumber is required');
  }
  return globals.functions.request({
    url: '/api/endpoint.json',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { requestString: { mobileNumber: params.mobileNumber } },
  });
}
```

Response shape: `Promise<{ ok: boolean, status: number, body: object }>`.
Use the `x-success-condition` from the YAML spec to distinguish application-level success from HTTP success.

## Custom Function Pattern

The rule editor parser **silently ignores `async function` declarations**. API clients are `async` and will not appear in the rule editor. Always wrap them in a plain sync exported function.

### Full Pattern

```javascript
import { apiName } from './api-clients';

// async helper — not exported, not registered
async function _callApiName(mobileNumber, globals) {
  var response = await apiName({ mobileNumber }, globals);
  if (response.ok) {
    globals.functions.setProperty(globals.form.resultField, { value: response.body.data });
  } else {
    globals.functions.markFieldAsInvalid(
      globals.form.mobileNumberField.$id,
      'Request failed: ' + response.status,
      { useId: true }
    );
  }
}

// sync exported wrapper — the only declaration the parser registers
/**
 * Fetch data via API Name.
 * @name fetchApiName
 * @param {STRING} mobileNumber - Mobile number
 * @param {SCOPE} globals
 */
function fetchApiName(mobileNumber, globals) {
  _callApiName(mobileNumber, globals).catch(function(err) {
    console.error('[fetchApiName]', err);
  });
}

export { fetchApiName };
```

### JSDoc Rules for the Sync Wrapper

| Constraint | Rule |
|---|---|
| Declaration | `function` only — NOT `async function` (parser silently ignores async) |
| `@name` | Required when exported name differs from declared name |
| `globals` param | Always last; `@param {SCOPE} globals` — parser strips it from args |
| Optional params | Bracket the name: `@param {STRING} [paramName]` |
| Types | `STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `ARRAY`, `OBJECT`, `SCOPE` |

### Fragment vs Form Scope

If the custom function lives in a fragment (`fd:fragment === true`), prefer `globals.$fragment` over `globals.form`:

```javascript
const scope = (globals.field?.fragment && globals.field.fragment !== '$form')
  ? globals.$fragment
  : globals.form;
globals.functions.setProperty(scope.resultField, { value: response.body.data });
```

### Common Mistakes

| Mistake | Fix |
|---|---|
| Exporting `async function` | Parser ignores it — use a plain `function` wrapper |
| Calling `await` in the exported function | Not possible in sync function — push to internal async helper |
| Using `fetch()` | Bypasses AEM's request pipeline — always use `globals.functions.request()` |
| Omitting `.catch()` on the async call | Unhandled rejections silently fail in the rule engine |
| Including `globals` in the rule's params array | Parser strips it automatically |

### Next Steps

After writing the custom function:
1. Use **forms-rule-author** to generate the rule AST that calls `fetchApiName`
2. Use **forms-author** to patch that rule into the form's content model JSON

Do not hand-edit form content model files directly.

## File Structure

```
$FORMS_WORKSPACE/refs/apis/                        # OpenAPI 3.0 YAML specs (source of truth)
├── _template.yaml                # Template for new APIs
└── *.yaml                        # Individual API specs

<eds-repo-root>/blocks/form/api-clients/     # JS API client files
└── *.js
```
