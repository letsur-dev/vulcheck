import fse from 'fs-extra';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { copySync, ensureDirSync, existsSync, readJsonSync, writeJsonSync, readdirSync, removeSync } = fse;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, '..', 'templates');

/**
 * Get the path to the bundled templates directory.
 */
export function getTemplatesDir() {
  return TEMPLATES_DIR;
}

/**
 * Copy skill templates to the target project's .claude/skills/ directory.
 */
export function copySkills(projectRoot) {
  const srcSkills = join(TEMPLATES_DIR, 'skills');
  const destSkills = join(projectRoot, '.claude', 'skills');
  ensureDirSync(destSkills);
  copySync(srcSkills, destSkills, { overwrite: true });
}

/**
 * Copy agent templates to the target project's .claude/agents/ directory.
 */
export function copyAgents(projectRoot) {
  const srcAgents = join(TEMPLATES_DIR, 'agents');
  const destAgents = join(projectRoot, '.claude', 'agents');
  ensureDirSync(destAgents);
  copySync(srcAgents, destAgents, { overwrite: true });
}

/**
 * Write the VulChk config file.
 */
export function writeConfig(projectRoot, config) {
  const configDir = join(projectRoot, '.vulchk');
  ensureDirSync(configDir);
  writeJsonSync(join(configDir, 'config.json'), config, { spaces: 2 });
}

/**
 * Read existing VulChk config, or return null if not found.
 */
export function readConfig(projectRoot) {
  const configPath = join(projectRoot, '.vulchk', 'config.json');
  if (!existsSync(configPath)) return null;
  try {
    return readJsonSync(configPath);
  } catch {
    return null;
  }
}

/**
 * Check if VulChk is already initialized in the project.
 */
export function isInitialized(projectRoot) {
  return existsSync(join(projectRoot, '.vulchk', 'config.json'));
}

/**
 * Remove vulchk-prefixed skill directories (preserves user-created skills).
 */
export function cleanVulchkSkills(projectRoot) {
  const skillsDir = join(projectRoot, '.claude', 'skills');
  if (!existsSync(skillsDir)) return;
  for (const entry of readdirSync(skillsDir)) {
    if (entry.startsWith('vulchk-')) {
      removeSync(join(skillsDir, entry));
    }
  }
}

/**
 * Remove vulchk-prefixed agent files (preserves user-created agents).
 */
export function cleanVulchkAgents(projectRoot) {
  const agentsDir = join(projectRoot, '.claude', 'agents');
  if (!existsSync(agentsDir)) return;
  for (const entry of readdirSync(agentsDir)) {
    if (entry.startsWith('vulchk-') && entry.endsWith('.md')) {
      removeSync(join(agentsDir, entry));
    }
  }
}
