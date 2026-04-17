# Checkout Error Triage

## Problem/Feature Description

An engineering team is investigating a spike in support tickets from customers who couldn't complete purchases on `store.example.com`. The hypothesis is that JavaScript errors on the checkout and payment pages are interrupting the purchase flow. The team wants to identify exactly which errors are occurring on those specific pages so they can prioritize fixes.

They also want a second view: the same checkout/payment pages but showing only sessions where errors did NOT occur, so they can estimate how many users had a clean experience. This comparison will help them quantify the impact.

The team uses the `optel-query` CLI tool (the `optel-query.jsh` script at `skills/optel-query/scripts/optel-query.jsh`) and wants two queries for the past 14 days. Write a shell script `error-triage.sh` with both commands, invoking the script as `node ../../skills/optel-query/scripts/optel-query.jsh` (assume it is run from an eval subfolder), and a brief comment above each.

## Output Specification

Produce a shell script named `error-triage.sh` containing:
1. A command that discovers which errors are occurring on the checkout and payment pages (`https://store.example.com/checkout` and `https://store.example.com/payment`) over the past 14 days
2. A command that counts page views on those same pages where no errors were recorded

Dates should be computed dynamically. Scope queries as tightly as possible to the relevant pages and event types.
