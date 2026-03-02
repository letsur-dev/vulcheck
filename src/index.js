import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initCommand } from './commands/init.js';
import {
  getCachedUpdateInfo,
  refreshUpdateCache,
  printUpdateNotification,
} from './utils/update-check.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

// Show update notification from cache (sync, fast — no network call here)
const cachedUpdate = getCachedUpdateInfo(pkg.version);
if (cachedUpdate?.updateAvailable) {
  printUpdateNotification(pkg.version, cachedUpdate.latestVersion);
}

// Refresh cache in the background — does not block CLI startup
refreshUpdateCache().catch(() => {});

const program = new Command();

program
  .name('vulchk')
  .description('Security analysis toolkit for Claude Code')
  .version(pkg.version);

program
  .command('init')
  .description('Initialize VulChk in the current project')
  .option('--lang <language>', 'Set report language (skip prompt)')
  .option('--deploy <environment>', 'Set deployment environment (skip prompt)')
  .option('--force', 'Overwrite existing configuration')
  .action(initCommand);

await program.parseAsync();
