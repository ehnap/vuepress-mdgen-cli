#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const yargs = require("yargs/yargs");

// 默认模板文件夹路径：包中的默认模板文件夹
const DEFAULT_TEMPLATES_DIR = path.resolve(process.cwd(), "src", ".mdgen-templates");

// VuePress MD Template 包内的默认模板文件夹
const PACKAGE_TEMPLATES_DIR = path.resolve(__dirname,"../","templates");

// 获取命令行参数
const argv = yargs(process.argv.slice(2))
  .option("templates", {
    alias: "t",
    type: "string",
    description: "Path to custom templates directory",
  })
  .help()
  .argv;

// 获取模板文件夹路径：先检查命令行参数，若没有，再检查环境变量，最后使用默认模板文件夹
let TEMPLATES_DIR =
  argv.templates ||
  process.env.TEMPLATES_DIR ||
  DEFAULT_TEMPLATES_DIR;

// 如果以上都找不到，则使用包内的默认模板文件夹
if (!fs.existsSync(TEMPLATES_DIR)) {
  console.log(`Using default templates folder from package: ${PACKAGE_TEMPLATES_DIR}`);
  TEMPLATES_DIR = PACKAGE_TEMPLATES_DIR;
}

// 加载模板配置
const loadTemplates = () => {
  const templates = {};
  const configPath = path.join(TEMPLATES_DIR, "config.json");

  if (fs.existsSync(configPath)) {
    Object.assign(templates, JSON.parse(fs.readFileSync(configPath, "utf8")));
  } else {
    console.error(`Config file not found in: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  return templates;
};

const templates = loadTemplates();

// 获取当前日期时间
const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0];
};

// 命令行参数
const args = argv._;
if (args.length < 1) {
  console.error("Usage: mdgen <filename> [template]");
  process.exit(1);
}

const [fileName, template = "default"] = args; // 默认模板为 "default"

// 查找模板配置
const templateConfig = templates[template] || templates["default"];

// 获取模板文件路径
const templateFileName = templateConfig.template || "default.md";

// 获取模板配置
const { directory: dir, categories } = templates[template];

// 确定模板路径
const templatePath = path.join(TEMPLATES_DIR, templateFileName);

// 检查模板文件是否存在
if (!fs.existsSync(templatePath)) {
  console.error(`Template file "${template}.md" not found in ${TEMPLATES_DIR}`);
  process.exit(1);
}

// 目标文件路径
const outputDir = dir || process.cwd(); // 如果目录未配置，默认为当前工作目录
const outputPath = path.join(outputDir, `${fileName}.md`);

// 确保目标目录存在
fs.mkdirSync(outputDir, { recursive: true });

// 读取模板内容
let templateContent = fs.readFileSync(templatePath, "utf8");

// 动态变量替换
const replacements = {
  title: fileName.replace(/-/g, " "), // 使用文件名生成标题，替换 "-" 为空格
  date: getCurrentDate(),
  categories,
};

Object.entries(replacements).forEach(([key, value]) => {
  const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
  templateContent = templateContent.replace(regex, value);
});

// 写入目标文件
if (fs.existsSync(outputPath)) {
  console.error(`File "${outputPath}" already exists. Use a different name.`);
  process.exit(1);
}

fs.writeFileSync(outputPath, templateContent);

console.log(`Markdown file generated: ${outputPath}`);