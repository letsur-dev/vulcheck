import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

const PACKAGE_NAME = '@letsur-dev/vulchk';
const REGISTRY_URL = 'https://npm.pkg.github.com';
const CACHE_FILE = join(homedir(), '.vulchk-update-check.json');
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

function getAuthToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.NODE_AUTH_TOKEN) return process.env.NODE_AUTH_TOKEN;

  for (const dir of [homedir(), process.cwd()]) {
    try {
      const npmrc = readFileSync(join(dir, '.npmrc'), 'utf-8');
      const match = npmrc.match(/\/\/npm\.pkg\.github\.com\/:_authToken=(.+)/);
      if (match) return match[1].trim();
    } catch {
      // not found in this location, try next
    }
  }
  return null;
}

/**
 * Reads the cached update check result. Returns null if cache is missing,
 * expired (>24h), or the current version is already up to date.
 */
export function getCachedUpdateInfo(currentVersion) {
  try {
    const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    if (!cache?.latestVersion) return null;
    if (Date.now() - cache.checkedAt > CHECK_INTERVAL_MS) return null;
    return {
      latestVersion: cache.latestVersion,
      updateAvailable: compareSemver(cache.latestVersion, currentVersion) > 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches the latest version from GitHub Packages and writes it to the cache.
 * Requires a GitHub auth token in GITHUB_TOKEN, NODE_AUTH_TOKEN, or ~/.npmrc.
 * Silently no-ops if no token is available or the request fails.
 */
export async function refreshUpdateCache() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const encodedName = PACKAGE_NAME.replace('/', '%2f');
    const response = await fetch(`${REGISTRY_URL}/${encodedName}/latest`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return;

    const data = await response.json();
    if (!data.version) return;

    writeFileSync(
      CACHE_FILE,
      JSON.stringify({ checkedAt: Date.now(), latestVersion: data.version })
    );
  } catch {
    // Silently ignore — network errors must not interrupt the CLI
  }
}

export function printUpdateNotification(currentVersion, latestVersion) {
  const divider = chalk.yellow('  ' + '─'.repeat(56));
  console.log(divider);
  console.log(
    chalk.yellow('  Update available! ') +
    chalk.dim(currentVersion) + chalk.yellow(' → ') + chalk.green.bold(latestVersion)
  );
  console.log(
    chalk.yellow('  Run: ') + chalk.cyan(`npm install -g ${PACKAGE_NAME}`)
  );
  console.log(divider);
  console.log('');
}
