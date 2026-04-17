# Lead Generation Form Abandonment Analysis

## Problem/Feature Description

A growth team at a B2B software company is concerned that visitors are starting to fill out the contact form on `leads.example.com/contact` but leaving before they submit. They want to measure two things: how many sessions involved someone interacting with the form (i.e., started filling it), and how many of those ended without a form submission. They also want to know which specific form fields users are engaging with, to identify if a particular field is causing dropoff.

They are also curious about the form load performance — if the form takes too long to appear, users may abandon before even touching it. They want form load time metrics included in a separate query.

The team uses `optel-query` (the `optel-query.jsh` script at `skills/optel-query/scripts/optel-query.jsh`) and wants a shell script `form-analysis.sh` covering the past 14 days. Invoke the script as `node ../../skills/optel-query/scripts/optel-query.jsh` (assume it is run from an eval subfolder). Add a short comment above each command.

## Output Specification

Produce a shell script named `form-analysis.sh` containing:
1. A command that counts sessions where users started filling the contact form but did NOT submit it on `https://leads.example.com/contact`
2. A command that enumerates which form fields users are filling (to see which fields get touched)
3. A command that retrieves form load time metrics for the contact page

Dates should be computed dynamically. Scope queries as tightly as possible to the relevant events.
