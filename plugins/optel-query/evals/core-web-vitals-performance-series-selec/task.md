# Performance Regression Investigation

## Problem/Feature Description

A web performance engineer at a SaaS company noticed that users on mobile devices have been complaining about slow page loads on `app.example.com` since a recent deployment. The engineer wants to investigate whether the Core Web Vitals scores for mobile visitors have degraded and, separately, whether mobile users are bouncing more than desktop users.

They want to compare: (a) the actual performance metric values for mobile visitors on the product pages, and (b) simple traffic volume counts split by device type for the same pages — to understand if the complaint volume matches the actual traffic proportions.

The team uses `optel-query` (the `optel-query.jsh` script at `skills/optel-query/scripts/optel-query.jsh`) and wants these as a shell script `perf-check.sh` covering the past 30 days. Invoke the script as `node ../../skills/optel-query/scripts/optel-query.jsh` (assume it is run from an eval subfolder). Add a comment above each command describing its purpose.

## Output Specification

Produce a shell script named `perf-check.sh` containing:
1. A command that retrieves Core Web Vitals metrics (LCP, CLS, and INP) for mobile visitors on `https://app.example.com/product` over the last 30 days
2. A command that counts page views broken down by device type (mobile vs desktop) on that same page for the same period — without requesting performance metrics

Dates should be computed dynamically.
