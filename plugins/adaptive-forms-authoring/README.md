# Adobe Skills for Adaptive Forms Authoring
Build, edit, and manage AEM Adaptive Forms with natural language prompts. This plugin provides a suite of skills for form analysis, content authoring, rule creation, integration management, and context handling — all orchestrated through a central router that translates requirements into actionable plans. Whether you're starting from scratch or iterating on existing forms, these skills empower you to streamline your AEM Forms development process with ease.

## Install

### Claude Code

```bash
/plugin marketplace add adobe/skills
/plugin install adaptive-forms-authoring@adobe-skills
```

### Vercel Skills (npx)

```bash
# Install all skills
npx skills add adobe/skills --path plugins/adaptive-forms-authoring --all

# Install a single skill
npx skills add adobe/skills --path plugins/adaptive-forms-authoring --skill create-form

# List what's available
npx skills add adobe/skills --path plugins/adaptive-forms-authoring --list
```

## Available Skills

### AEM Forms

Turn natural language into production AEM Adaptive Forms. A plan-driven skill gateway across 5 domains.

**Quick Start:**
```bash
# Say: "Set up a new AEM Forms workspace for my project."
# Then: "Here's the requirements doc for my form. Build it."
```

The **forms-orchestrator** routes intents through a 6-step algorithm — it generates plans from requirements via a Planner, resolves skills via a Domain Registry, and executes them. For single tasks it routes directly to the matching domain.

#### Domains

| Domain | Skills |
|--------|--------|
| `analysis` | `analyze-requirements`, `analyze-v1-form`, `create-screen-doc`, `jud-to-screen` |
| `content-author` | `forms-author`, `forms-content-modeler`, `forms-custom-components` |
| `rule-creator` | `forms-rule-author` |
| `integration` | `manage-apis` |
| `context-management` | `manage-context` |

**Requirements:** Node.js 18+, `git` on PATH.

## Repository Structure

```
forms-skills/
├── .claude-plugin/plugin.json          ← plugin identity (aem-forms)
├── evals/                              ← eval scenarios, fixtures, runner scripts
├── lib/                                ← shared scripts and Python runtime
│   └── scripts/                           (api-manager, setup.sh, venv)
└── skills/
    ├── forms-orchestrator/             ← entry point router
    ├── forms-analysis/                 ← analysis domain
    ├── forms-author/                   ← content authoring domain
    │   ├── scripts/                    ← pre-built bundles (no npm install at runtime)
    │   └── references/
    ├── forms-content-modeler/          ← component JSON builder (used by forms-author)
    │   ├── scripts/
    │   └── references/
    ├── forms-custom-components/        ← custom EDS component authoring (fd:viewType pattern)
    │   ├── scripts/
    │   └── references/
    ├── forms-rule-author/             ← rule & custom function authoring
    ├── forms-integration/              ← integration domain
    └── forms-context-management/       ← context & session domain
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines on adding or updating skills. Join [#agentskills](https://adobe.enterprise.slack.com/archives/C0APTKDNPEY) on Adobe Slack for questions and discussion.

## Resources

- [agentskills.io Specification](https://agentskills.io)
- [Claude Code Plugins](https://code.claude.com/docs/en/discover-plugins)
- [#agentskills Slack Channel](https://adobe.enterprise.slack.com/archives/C0APTKDNPEY)

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.
