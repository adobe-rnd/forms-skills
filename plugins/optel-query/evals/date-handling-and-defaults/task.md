# Quarterly Page Traffic Summary

## Problem/Feature Description

A content strategist at a media company wants a quick overview of how their website `editorial.example.com` has been performing recently. They're preparing for a monthly review meeting and need page view counts for recent periods, but they haven't specified exact dates — just general timeframes like "the last couple of weeks" and "last month." They also want to understand which pages have been getting the most traffic during those periods.

The analyst on their team has access to the `optel-query` CLI tool (the `optel-query.jsh` script at `skills/optel-query/scripts/optel-query.jsh`) and needs to produce a shell script that runs the appropriate queries so the output can be reviewed before the meeting.

## Output Specification

Produce a shell script named `query.sh` that:
1. Queries `editorial.example.com` for overall page views for the **last 7 days** (no date explicitly given — use the appropriate default)
2. Queries `editorial.example.com` for overall page views for **last month** (the full previous calendar month)
3. Retrieves the top pages by traffic for **last month** using the appropriate facet-values option

The script should use `node ../../skills/optel-query/scripts/optel-query.jsh` as the command (assume it is run from an eval subfolder). All date values must be computed dynamically using shell date commands — do not hardcode any specific dates. Include a brief comment above each command explaining what it does.

Save the final script as `query.sh` in the working directory.
