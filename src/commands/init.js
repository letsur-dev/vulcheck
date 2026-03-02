import Enquirer from 'enquirer';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  copySkills,
  copyAgents,
  writeConfig,
  isInitialized,
  readConfig,
  cleanVulchkSkills,
  cleanVulchkAgents,
} from '../utils/file-ops.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));

const LANGUAGES = [
  { name: 'en', message: 'English' },
  { name: 'ko', message: '한국어 (Korean)' },
];

const DEPLOYMENTS = [
  { name: 'vercel', message: 'Vercel (Serverless)' },
  { name: 'k8s', message: 'Kubernetes (EKS, GKE, AKS, etc.)' },
  { name: 'docker', message: 'Docker (standalone containers)' },
  { name: 'other', message: 'Other (custom environment)' },
];

function printBanner() {
  console.log();
  console.log(chalk.bold.red('  ╦  ╦┬ ┬┬  ╔═╗┬ ┬┬┌─'));
  console.log(chalk.bold.red('  ╚╗╔╝│ ││  ║  ├─┤├┴┐'));
  console.log(chalk.bold.red('   ╚╝ └─┘┴─┘╚═╝┴ ┴┴ ┴'));
  console.log(chalk.dim(`  Security Analysis Toolkit v${pkg.version}`));
  console.log();
}

export async function initCommand(options) {
  printBanner();

  const projectRoot = process.cwd();

  // Check for existing configuration
  if (isInitialized(projectRoot) && !options.force) {
    const existing = readConfig(projectRoot);

    // Version mismatch → automatic upgrade (no prompts)
    if (existing?.version && existing.version !== pkg.version) {
      const oldVersion = existing.version;
      cleanVulchkSkills(projectRoot);
      cleanVulchkAgents(projectRoot);
      copySkills(projectRoot);
      copyAgents(projectRoot);
      existing.version = pkg.version;
      writeConfig(projectRoot, existing);
      console.log(chalk.green('  ✓') + ` Templates upgraded: ${chalk.dim(oldVersion)} → ${chalk.green(pkg.version)}`);
      return;
    }

    // Version matches → existing reconfigure/skip prompt
    console.log(chalk.yellow('  VulChk is already initialized in this project.'));
    console.log(chalk.dim(`  Current config: language=${existing?.language || 'unknown'}, deployment=${existing?.deployment || 'unknown'}`));
    console.log();

    const enquirer = new Enquirer();
    const { action } = await enquirer.prompt({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'reconfigure', message: 'Reconfigure (overwrite existing settings)' },
        { name: 'skip', message: 'Skip (keep current settings)' },
      ],
    });

    if (action === 'skip') {
      console.log(chalk.dim('  Skipped. Existing configuration preserved.'));
      return;
    }
  }

  // Determine language
  let language = options.lang;

  if (!language) {
    const enquirer = new Enquirer();
    const response = await enquirer.prompt({
      type: 'select',
      name: 'language',
      message: 'Select report language',
      choices: LANGUAGES,
    });
    language = response.language;
  }

  // Validate language
  const validLangs = LANGUAGES.map((l) => l.name);
  if (!validLangs.includes(language)) {
    console.error(chalk.red(`  Invalid language: ${language}`));
    console.error(chalk.dim(`  Valid options: ${validLangs.join(', ')}`));
    process.exit(1);
  }

  // Determine deployment environment
  let deployment = options.deploy;

  if (!deployment) {
    const enquirer = new Enquirer();
    const response = await enquirer.prompt({
      type: 'select',
      name: 'deployment',
      message: 'Select primary deployment environment',
      choices: DEPLOYMENTS,
    });
    deployment = response.deployment;
  }

  // Handle "other" — prompt for custom input
  if (deployment === 'other') {
    const enquirer = new Enquirer();
    const response = await enquirer.prompt({
      type: 'input',
      name: 'customDeployment',
      message: 'Enter your deployment environment (e.g., AWS ECS, Fly.io)',
    });
    deployment = response.customDeployment || 'other';
  }

  // Write config
  const config = {
    language,
    deployment,
    version: pkg.version,
  };

  console.log();
  console.log(chalk.dim('  Setting up VulChk...'));

  writeConfig(projectRoot, config);
  console.log(chalk.green('  ✓') + ' Configuration written to .vulchk/config.json');

  // Copy skills
  copySkills(projectRoot);
  console.log(chalk.green('  ✓') + ' Skills installed to .claude/skills/');

  // Copy agents
  copyAgents(projectRoot);
  console.log(chalk.green('  ✓') + ' Agents installed to .claude/agents/');

  // Summary
  console.log();
  console.log(chalk.bold.green('  VulChk initialized successfully!'));
  console.log();
  console.log(chalk.dim('  Available commands in Claude Code:'));
  console.log(`    ${chalk.cyan('/vulchk.codeinspector')}  — Scan code for vulnerabilities`);
  console.log(`    ${chalk.cyan('/vulchk.hacksimulator')}  — Simulate penetration testing`);
  console.log();
}
