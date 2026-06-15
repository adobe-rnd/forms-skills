# Adobe AEM Forms Skills

[![Validate Skills](https://github.com/adobe-rnd/forms-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/adobe-rnd/forms-skills/actions/workflows/validate.yml)

A collection of AI agent plugins for building, editing, and integrating AEM Forms through conversation — install the plugins you need and let your agent do the rest.

## Plugins

| Plugin | Description |
|--------|-------------|
| [`adaptive-forms-authoring`](plugins/adaptive-forms-authoring/) | Analyze requirements, scaffold forms, add rules and functions, manage APIs, and sync with Edge Delivery Services. |

## Install

### Claude Code

```bash
# 1. Register the marketplace (once per machine)
/plugin marketplace add adobe-rnd/forms-skills

# 2. Install a plugin
/plugin install adaptive-forms-authoring@forms-skills
```

### Vercel Skills (npx)

```bash
# List available skills
npx skills add adobe-rnd/forms-skills --list

# Install all skills
npx skills add adobe-rnd/forms-skills --all

# Install a specific skill
npx skills add adobe-rnd/forms-skills --skill forms-author
```

See each plugin's README for prerequisites, required environment variables, and first-run instructions.

## Repository layout

```
forms-skills/
├── .claude-plugin/marketplace.json   # marketplace registry
├── plugins/
│   └── <plugin-name>/                # one directory per plugin
│       ├── .claude-plugin/plugin.json
│       ├── README.md
│       ├── skills/
│       ├── agents/
│       └── hooks/
├── docs/skill-architecture/          # architectural references and templates
├── CONTRIBUTING.md
└── README.md
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contributor workflow, skill authoring conventions, and quality checks. Architectural patterns for building new plugins and skill trees are in [`docs/skill-architecture/`](docs/skill-architecture/).

## License

Apache 2.0 — see [LICENSE](LICENSE).
