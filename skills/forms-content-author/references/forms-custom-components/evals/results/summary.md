# Evals summary: create-component

| Scenario | Verdict | Attempts | Duration |
|---|---|---|---|
| 01-happy-path-countdown | ❌ fail | 1 | 3.6s |
| 02-extend-checkbox-group | ❌ fail | 1 | 403ms |
| 03-ambiguous-base-requests-clarification | ❌ fail | 1 | 385ms |
| 04-extend-panel-child-subscriptions | ❌ fail | 1 | 381ms |
| 05-modal-overlay-panel | ❌ fail | 1 | 353ms |

## No regressions detected.

## New scenarios (not in baseline)
- 01-happy-path-countdown
- 02-extend-checkbox-group
- 03-ambiguous-base-requests-clarification
- 04-extend-panel-child-subscriptions

## Failed scenario: 01-happy-path-countdown
- validator:agent_error() — 403 The security token included in the request is invalid.
- rubric:uses-scaffold-command — agent failed before judging
- rubric:extends-not-replaces — agent failed before judging
- rubric:adds-field-to-form-json — agent failed before judging

## Failed scenario: 02-extend-checkbox-group
- validator:agent_error() — 403 The security token included in the request is invalid.
- rubric:extends-checkbox-group — agent failed before judging
- rubric:transforms-option-ui — agent failed before judging
- rubric:reacts-to-group-value — agent failed before judging
- rubric:uses-listen-changes — agent failed before judging

## Failed scenario: 03-ambiguous-base-requests-clarification
- validator:agent_error() — 403 The security token included in the request is invalid.
- rubric:asks-before-guessing — agent failed before judging
- rubric:does-not-scaffold — agent failed before judging
- rubric:does-not-edit-mappings — agent failed before judging

## Failed scenario: 04-extend-panel-child-subscriptions
- validator:agent_error() — 403 The security token included in the request is invalid.
- rubric:extends-panel — agent failed before judging
- rubric:enumerates-children-via-model-items — agent failed before judging
- rubric:subscribes-to-each-child-wrapper — agent failed before judging
- rubric:reacts-to-child-value-changes — agent failed before judging
- rubric:uses-listen-changes — agent failed before judging

## Failed scenario: 05-modal-overlay-panel
- validator:agent_error() — 403 The security token included in the request is invalid.
- rubric:uses-panel-base — agent failed before judging
- rubric:reacts-via-subscribe-visible — agent failed before judging
- rubric:extends-not-replaces — agent failed before judging
- rubric:registers-in-mappings — agent failed before judging
