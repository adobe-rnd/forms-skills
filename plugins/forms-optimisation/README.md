# forms-optimisation plugin

Optimise AEM Adaptive Forms for performance, accessibility, and user experience through AI-driven analysis and recommendations.

## Install

### Claude Code

```bash
/plugin marketplace add adobe/skills
/plugin install forms-optimisation@adobe-skills
```

### Vercel Skills (npx)

```bash
# Install all skills
npx skills add adobe/skills --path plugins/forms-optimisation --all

# Install a single skill
npx skills add adobe/skills --path plugins/forms-optimisation --skill <skill-name>

# List what's available
npx skills add adobe/skills --path plugins/forms-optimisation --list
```

## Plugin layout

```
plugins/forms-optimisation/
├── .claude-plugin/plugin.json
├── README.md
├── skills/           # add skills here
├── agents/           # custom subagents (none yet)
├── hooks/            # plugin hooks (none yet)
└── tests/
```

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
