# vuepress-plugin-mdgen

A CLI tool to generate Markdown files for VuePress2 project.

## Use

```shell
mdgen <filename> [templatename]
```

## Custom Templates

You can add custom templates in your project directory by creating a `.mdgen-templates` folder. The folder should include a `config.json` file and any additional template files.

### Example

1. Create a `.mdgen-templates` folder:

2. Add a `config.json` file to define your templates:

```json
{
  "default": {
    "directory": "./src",
    "categories": "Uncategorized",
    "template": "default.md"
  },
  "custom-template": {
    "directory": "./docs/custom",
    "categories": "Custom",
    "template": "custom.md"
  }
}
```

3. Add a Markdown template file, e.g., custom-template.md:

```markdown
---
title: {{ title }}
date: {{ date }}
categories: {{ categories }}
---

# {{ title }}

Welcome to your custom markdown template.
```

