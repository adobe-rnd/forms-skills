# Widget recovery

If the feedback widget disappears, here's how to bring it back.

## Scenario A — You clicked the minimize button (−)

The widget is **minimized**, not destroyed. Look for the floating 🎯 launcher button in the bottom-right corner of the page. Click it to expand the toolbar back. All your existing annotations are preserved.

Alternatively, press **Shift+S** anywhere on the page to toggle.

## Scenario B — You called `window.__styleScreen.destroy()` from the console

Annotations are gone. Re-inject via the skill (re-run `forms-style-screen`) or use the bookmarklet (Scenario D).

## Scenario C — The page was reloaded

The widget is gone entirely. Pending annotations are lost.

Re-inject via the skill — just say "re-inject the widget" and Claude will run the chrome-devtools `evaluate_script` to put it back.

## Scenario D — Bookmarklet (works without Claude)

The `aem up` dev server serves from `$FORMS_EDS_ROOT`, so the widget needs to live there to be fetchable from the page. One-time setup:

```bash
# copy from the skill's assets into the EDS repo scripts folder:
cp <path-to-plugin>/skills/forms-style-screen/assets/feedback-widget.js \
   $FORMS_EDS_ROOT/scripts/feedback-widget.js
```

Then save this as a browser bookmark — paste into the bookmark's URL field:

```
javascript:(()=>{const s=document.createElement('script');s.src='/scripts/feedback-widget.js?'+Date.now();document.head.appendChild(s);})();
```

Click the bookmark on any localhost form page to inject (or re-inject) the widget.

## Scenario E — Manual paste (always works)

If the bookmarklet isn't set up:

1. Open DevTools (Cmd+Opt+I on macOS).
2. Go to the **Console** tab.
3. Open `<path-to-plugin>/skills/forms-style-screen/assets/feedback-widget.js` in your editor, copy the entire contents, paste into the console, hit Enter.

The widget toolbar appears in the top-right.

## Useful console hooks (when widget is alive)

```js
window.__styleScreen.show()       // bring back from minimize
window.__styleScreen.hide()       // minimize
window.__styleScreen.destroy()    // remove entirely
window.__styleFeedback            // pending annotations array
window.__styleFeedbackReady       // true after user clicks Send
```
