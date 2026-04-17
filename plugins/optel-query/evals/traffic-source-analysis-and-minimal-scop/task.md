# Marketing Channel Attribution Report

## Problem/Feature Description

A digital marketing manager at an e-commerce company is preparing a channel attribution report for `shop.example.com`. They want to understand two things: first, which raw referring websites are sending the most visitors to their site; and second, how their paid advertising campaigns compare to email marketing campaigns in driving traffic.

They have a week's worth of data in mind (the past 7 days) and want separate CLI commands for each question. The company recently launched paid search campaigns on Google and Facebook, and they also send newsletters via Marketo. The marketing manager wants to see whether paid channels or email campaigns drove more visits. They do NOT need performance metrics — just visitor counts for each channel type.

The analyst will use the `optel-query` CLI tool (the `optel-query.jsh` script at `skills/optel-query/scripts/optel-query.jsh`). Write a shell script `attribution.sh` that runs the appropriate queries to answer both questions, invoking the script as `node ../../skills/optel-query/scripts/optel-query.jsh` (assume it is run from an eval subfolder). Add a comment above each command explaining what it answers.

## Output Specification

Produce a shell script named `attribution.sh` containing:
1. A query to discover which referrer URLs sent traffic to `shop.example.com` over the past 7 days
2. A query to count visits attributed to paid advertising channels (any vendor, any paid channel)
3. A query to count visits attributed to Marketo email campaigns specifically

Dates should be computed dynamically. Do not add performance series unless they are needed to answer the question.
