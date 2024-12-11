#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const yargs = require("yargs");

// 获取默认模板目录（全局包内路径）
const defaultTemplateDir = path.join(__dirname, "../templates");

// 项目根目录的默认模板路径
const projectTemplateDir = path.resolve(process.cwd(), "src/.mdgen-templates") || path.resolve(process.cwd(), "docs/.mdgen-templates");

// 用户可配置的全局模板路径
const userTemplateDir = process.env.VUEPRESS_MDGEN_TEMPLATES || path.resolve(require("os").homedir(), ".mdgen-templates");

// 加载配置文件
const loadConfig = (templateName) => {
  const configPath = path.resolve(projectTemplateDir, "config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (templateName && config[templateName]) {
      return config[templateName];
    }
    return config.default || {};
  }
  return {};
};

// 查找模板路径
const resolveTemplateDir = () => {
  if (fs.existsSync(projectTemplateDir)) return projectTemplateDir;
  if (fs.existsSync(userTemplateDir)) return userTemplateDir;
  return defaultTemplateDir;
};

// 创建 Markdown 文件
const createMarkdownFile = (filename, templateName) => {
  const templateDir = resolveTemplateDir();
  const config = loadConfig(templateName);
  const templateFile = config.template
    ? path.resolve(templateDir, config.template)
    : path.resolve(templateDir, `${templateName || "default"}.md`);

  if (!fs.existsSync(templateFile)) {
    console.error(`Template file not found: ${templateFile}`);
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), config.directory || "./src");
  const targetFile = path.resolve(targetDir, `${filename}.md`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 读取模板内容
  let templateContent = fs.readFileSync(templateFile, "utf-8");

  // 获取当前日期时间
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0];
  };

  // 动态变量替换
  const replacements = {
    title: filename.replace(/-/g, " "), // 使用文件名生成标题，替换 "-" 为空格
    date: getCurrentDate(),
    categories: config.categories || "General", // 使用模板配置的类别
  };

  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    templateContent = templateContent.replace(regex, value);
  });

  // 写入目标文件
  if (fs.existsSync(targetFile)) {
    console.error(`File "${targetFile}" already exists. Use a different name.`);
    process.exit(1);
  }

  fs.writeFileSync(targetFile, templateContent, "utf-8");
  console.log(`Markdown file created at: ${targetFile}`);
};

// 解析命令行参数
yargs(process.argv.slice(2))
  .command(
    "$0 <filename> [template]",
    "Generate a markdown file using the specified template",
    (yargs) => {
      yargs
        .positional("filename", {
          describe: "The name of the markdown file to create",
          type: "string",
        })
        .positional("template", {
          describe: "The name of the template to use",
          type: "string",
        });
    },
    (argv) => {
      createMarkdownFile(argv.filename, argv.template);
    }
  )
  .help()
  .argv;
