# Contact Us Form — Requirements

## Overview
A simple contact form that allows website visitors to submit inquiries.

## Fields

### Contact Information Panel
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full Name | Text | Yes | Min 2, Max 50 characters |
| Email | Email | Yes | Valid email format |
| Phone | Phone | No | — |

### Inquiry Panel
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Inquiry Type | Dropdown | Yes | Options: General, Support, Sales |
| Message | Text (multiline) | Yes | Min 10 characters |

## Business Rules
1. When Inquiry Type is "Support", show a prominent message field with required validation
2. When Inquiry Type is "Sales", prefill message with "I'm interested in learning more about..."

## API Integrations
None for this form.

## Submit Action
Display a thank-you message on successful submission.