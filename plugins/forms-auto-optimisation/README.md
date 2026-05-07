# forms-auto-optimisation plugin

Automatically detect and fix runtime errors and API failures in AEM Adaptive Forms — diagnoses journey errors, classifies root causes, and applies fixes to backend Java code.

## Install

### Claude Code

```bash
/plugin marketplace add adobe/skills
/plugin install forms-auto-optimisation@adobe-skills
```

### Vercel Skills (npx)

```bash
# Install all skills
npx skills add adobe/skills --path plugins/forms-auto-optimisation --all

# Install a single skill
npx skills add adobe/skills --path plugins/forms-auto-optimisation --skill <skill-name>

# List what's available
npx skills add adobe/skills --path plugins/forms-auto-optimisation --list
```

## Plugin layout

```
plugins/forms-auto-optimisation/
├── .claude-plugin/plugin.json
├── README.md
├── skills/
│   ├── auto-fix-form/      # diagnose and fix form runtime errors
│   └── auto-fix-journey/   # query Splunk, classify API errors, fix Java code
├── agents/                 # custom subagents (none yet)
├── hooks/                  # plugin hooks (none yet)
└── tests/
```

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
