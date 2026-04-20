# Adobe Skills for AI Coding Agents

Repository of Adobe AEM Forms skills for AI coding agents.

## Installation

### Claude Code Plugins

```bash
/plugin install github:adobe/forms-skills
```

## Available Skills

### AEM Forms

Turn natural language into production AEM Adaptive Forms. A plan-driven skill gateway with 16 skills across 6 domains.

**Quick Start:**
```bash
# Say: "Set up a new AEM Forms workspace for my project."
# Then: "Here's the requirements doc for my form. Build it."
```

The **forms-orchestrator** routes intents through a 6-step algorithm — it generates plans from requirements via a Planner, resolves skills via a Domain Registry, and executes them. For single tasks it routes directly to the matching domain.

#### Domains

| Domain | Skills |
|--------|--------|
| `analysis` | `analyze-requirements`, `analyze-v1-form`, `create-screen-doc`, `review-screen-doc` |
| `build` | `scaffold-form`, `create-form`, `create-component` |
| `logic` | `add-rules`, `create-function`, `optimize-rules` |
| `integration` | `manage-apis` |
| `infra` | `setup-workspace`, `sync-forms`, `sync-eds-code`, `git-sandbox` |
| `context` | `manage-context` |

**Requirements:** Node.js 18+, Python 3.10+, `git` on PATH. The plugin manages its own Python virtual environment — dependencies are installed automatically on first use.

## Repository Structure

```
forms-skills/
├── .claude-plugin/plugin.json     ← plugin identity (aem-forms)
├── .github/
│   ├── workflows/validate.yml
│   ├── CONTRIBUTING.md
│   └── CODE_OF_CONDUCT.md
├── forms-shared/                  ← shared runtime + api-manager
├── forms-orchestrator/            ← entry point router
├── forms-analysis/                ← analysis domain
├── forms-build/                   ← build domain
├── forms-context/                 ← context domain
├── forms-infra/                   ← infra domain
├── forms-integration/             ← integration domain
├── forms-logic/                   ← logic domain
├── pyproject.toml
├── package.json
└── README.md
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines on adding or updating skills. Join [#agentskills](https://adobe.enterprise.slack.com/archives/C0APTKDNPEY) on Adobe Slack for questions and discussion.

## Resources

- [agentskills.io Specification](https://agentskills.io)
- [Claude Code Plugins](https://code.claude.com/docs/en/discover-plugins)
- [#agentskills Slack Channel](https://adobe.enterprise.slack.com/archives/C0APTKDNPEY)

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.
