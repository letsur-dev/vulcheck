import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fse from 'fs-extra';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  copySkills,
  copyAgents,
  writeConfig,
  readConfig,
  isInitialized,
  getTemplatesDir,
} from '../src/utils/file-ops.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DIR = join(__dirname, '..', '.test-workspace');

describe('file-ops', () => {
  beforeEach(() => {
    fse.ensureDirSync(TEST_DIR);
  });

  afterEach(() => {
    fse.removeSync(TEST_DIR);
  });

  describe('writeConfig', () => {
    it('creates .vulchk/config.json with correct content', () => {
      const config = { language: 'en', version: '0.1.0' };
      writeConfig(TEST_DIR, config);

      const configPath = join(TEST_DIR, '.vulchk', 'config.json');
      expect(fse.existsSync(configPath)).toBe(true);

      const written = fse.readJsonSync(configPath);
      expect(written.language).toBe('en');
      expect(written.version).toBe('0.1.0');
    });

    it('creates .vulchk directory if it does not exist', () => {
      writeConfig(TEST_DIR, { language: 'ko', version: '0.1.0' });

      expect(fse.existsSync(join(TEST_DIR, '.vulchk'))).toBe(true);
    });

    it('overwrites existing config when called again', () => {
      writeConfig(TEST_DIR, { language: 'en', version: '0.1.0' });
      writeConfig(TEST_DIR, { language: 'ja', version: '0.1.0' });

      const config = readConfig(TEST_DIR);
      expect(config.language).toBe('ja');
    });

    it('writes all supported languages', () => {
      for (const lang of ['en', 'ko', 'ja', 'zh']) {
        writeConfig(TEST_DIR, { language: lang, version: '0.1.0' });
        const config = readConfig(TEST_DIR);
        expect(config.language).toBe(lang);
      }
    });

    it('writes deployment field to config', () => {
      const config = { language: 'en', deployment: 'vercel', version: '0.1.0' };
      writeConfig(TEST_DIR, config);

      const written = readConfig(TEST_DIR);
      expect(written.deployment).toBe('vercel');
    });

    it('writes all deployment environments', () => {
      for (const deploy of ['vercel', 'k8s', 'docker', 'other', 'AWS ECS']) {
        writeConfig(TEST_DIR, { language: 'en', deployment: deploy, version: '0.1.0' });
        const config = readConfig(TEST_DIR);
        expect(config.deployment).toBe(deploy);
      }
    });
  });

  describe('readConfig', () => {
    it('returns null when config does not exist', () => {
      expect(readConfig(TEST_DIR)).toBeNull();
    });

    it('reads existing config correctly', () => {
      writeConfig(TEST_DIR, { language: 'ko', version: '0.1.0' });

      const config = readConfig(TEST_DIR);
      expect(config).toEqual({ language: 'ko', version: '0.1.0' });
    });

    it('returns null when config file is malformed', () => {
      const configDir = join(TEST_DIR, '.vulchk');
      fse.ensureDirSync(configDir);
      fse.writeFileSync(join(configDir, 'config.json'), 'not valid json');

      expect(readConfig(TEST_DIR)).toBeNull();
    });
  });

  describe('isInitialized', () => {
    it('returns false when not initialized', () => {
      expect(isInitialized(TEST_DIR)).toBe(false);
    });

    it('returns true when config exists', () => {
      writeConfig(TEST_DIR, { language: 'en', version: '0.1.0' });
      expect(isInitialized(TEST_DIR)).toBe(true);
    });
  });

  describe('copySkills', () => {
    it('copies skill templates to .claude/skills/', () => {
      copySkills(TEST_DIR);

      const skillDir = join(TEST_DIR, '.claude', 'skills');
      expect(fse.existsSync(skillDir)).toBe(true);

      const codeinspectorSkill = join(skillDir, 'vulchk-codeinspector', 'SKILL.md');
      expect(fse.existsSync(codeinspectorSkill)).toBe(true);

      const hacksimulatorSkill = join(skillDir, 'vulchk-hacksimulator', 'SKILL.md');
      expect(fse.existsSync(hacksimulatorSkill)).toBe(true);
    });

    it('skill files contain YAML frontmatter', () => {
      copySkills(TEST_DIR);

      const skillPath = join(TEST_DIR, '.claude', 'skills', 'vulchk-codeinspector', 'SKILL.md');
      const content = fse.readFileSync(skillPath, 'utf-8');
      expect(content.startsWith('---\n')).toBe(true);
      expect(content).toContain('name: vulchk-codeinspector');
      expect(content).toContain('allowed-tools:');
    });

    it('creates .claude/skills/ directory if missing', () => {
      expect(fse.existsSync(join(TEST_DIR, '.claude'))).toBe(false);
      copySkills(TEST_DIR);
      expect(fse.existsSync(join(TEST_DIR, '.claude', 'skills'))).toBe(true);
    });
  });

  describe('copyAgents', () => {
    it('copies all 12 agent templates to .claude/agents/', () => {
      copyAgents(TEST_DIR);

      const agentDir = join(TEST_DIR, '.claude', 'agents');
      expect(fse.existsSync(agentDir)).toBe(true);

      const expectedAgents = [
        'vulchk-dependency-auditor.md',
        'vulchk-code-pattern-scanner.md',
        'vulchk-secrets-scanner.md',
        'vulchk-git-history-auditor.md',
        'vulchk-container-security-analyzer.md',
        'vulchk-attack-planner.md',
        'vulchk-attack-executor-recon.md',
        'vulchk-attack-executor-injection.md',
        'vulchk-attack-executor-auth.md',
        'vulchk-attack-executor-business.md',
        'vulchk-attack-executor-baas.md',
        'vulchk-attack-executor-exploit.md',
      ];

      for (const agent of expectedAgents) {
        expect(fse.existsSync(join(agentDir, agent))).toBe(true);
      }
    });

    it('agent files contain YAML frontmatter', () => {
      copyAgents(TEST_DIR);

      const agentDir = join(TEST_DIR, '.claude', 'agents');
      const files = fse.readdirSync(agentDir).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const content = fse.readFileSync(join(agentDir, file), 'utf-8');
        expect(content.startsWith('---\n')).toBe(true);
        expect(content).toContain('name:');
        expect(content).toContain('description:');
      }
    });
  });

  describe('getTemplatesDir', () => {
    it('returns a valid directory path', () => {
      const dir = getTemplatesDir();
      expect(fse.existsSync(dir)).toBe(true);
    });

    it('templates directory contains skills and agents', () => {
      const dir = getTemplatesDir();
      expect(fse.existsSync(join(dir, 'skills'))).toBe(true);
      expect(fse.existsSync(join(dir, 'agents'))).toBe(true);
      expect(fse.existsSync(join(dir, 'config.json'))).toBe(true);
    });
  });

  describe('full init flow', () => {
    it('creates all expected files and directories', () => {
      const config = { language: 'en', version: '0.1.0' };
      writeConfig(TEST_DIR, config);
      copySkills(TEST_DIR);
      copyAgents(TEST_DIR);

      // Config
      expect(fse.existsSync(join(TEST_DIR, '.vulchk', 'config.json'))).toBe(true);

      // Skills
      expect(fse.existsSync(join(TEST_DIR, '.claude', 'skills', 'vulchk-codeinspector', 'SKILL.md'))).toBe(true);
      expect(fse.existsSync(join(TEST_DIR, '.claude', 'skills', 'vulchk-hacksimulator', 'SKILL.md'))).toBe(true);

      // Agents
      const agentDir = join(TEST_DIR, '.claude', 'agents');
      const agents = fse.readdirSync(agentDir).filter((f) => f.startsWith('vulchk-'));
      expect(agents.length).toBe(12);

      // Initialized
      expect(isInitialized(TEST_DIR)).toBe(true);
    });

    it('re-initialization preserves new config', () => {
      writeConfig(TEST_DIR, { language: 'en', version: '0.1.0' });
      copySkills(TEST_DIR);
      copyAgents(TEST_DIR);

      // Re-init with different language
      writeConfig(TEST_DIR, { language: 'ko', version: '0.1.0' });
      copySkills(TEST_DIR);
      copyAgents(TEST_DIR);

      const config = readConfig(TEST_DIR);
      expect(config.language).toBe('ko');
      expect(isInitialized(TEST_DIR)).toBe(true);
    });
  });
});
