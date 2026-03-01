import { describe, it, expect } from 'vitest';
import fse from 'fs-extra';
import { join } from 'path';
import { getTemplatesDir } from '../src/utils/file-ops.js';

const TEMPLATES_DIR = getTemplatesDir();

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns an object with parsed key-value pairs, or null if invalid.
 */
function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) return null;

  const endIdx = content.indexOf('\n---', 4);
  if (endIdx === -1) return null;

  const yaml = content.substring(4, endIdx);
  const result = {};

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Handle simple key: value pairs
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.substring(0, colonIdx).trim();
    let value = trimmed.substring(colonIdx + 1).trim();

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

describe('template validation', () => {
  describe('skill templates', () => {
    const skillDirs = ['vulchk-codeinspector', 'vulchk-hacksimulator'];

    for (const skillDir of skillDirs) {
      describe(skillDir, () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', skillDir, 'SKILL.md');

        it('file exists', () => {
          expect(fse.existsSync(skillPath)).toBe(true);
        });

        it('has valid YAML frontmatter', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          const fm = parseFrontmatter(content);
          expect(fm).not.toBeNull();
        });

        it('has required name field', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          const fm = parseFrontmatter(content);
          expect(fm.name).toBe(skillDir);
        });

        it('has description field', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          const fm = parseFrontmatter(content);
          expect(fm.description).toBeTruthy();
          expect(fm.description.length).toBeGreaterThan(10);
        });

        it('has allowed-tools field', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          expect(content).toContain('allowed-tools:');
        });

        it('allowed-tools includes Task for sub-agent dispatch', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          expect(content).toMatch(/allowed-tools:.*Task/);
        });

        it('contains report language reference table', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          expect(content).toContain('Report Language Reference');
          expect(content).toContain('English (en)');
          expect(content).toContain('Korean (ko)');
          expect(content).toContain('Japanese (ja)');
        });

        it('contains severity labels by language', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          expect(content).toContain('Severity Labels by Language');
          expect(content).toContain('Critical');
          expect(content).toContain('치명적');
          expect(content).toContain('致命的');
        });

        it('contains redaction rules', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          expect(content).toContain('Redaction Rules');
          expect(content).toContain('Redaction Patterns');
        });

        it('preserves security terms in English', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          expect(content).toContain('Security terms');
          expect(content).toContain('remain in English');
        });
      });
    }

    describe('vulchk-hacksimulator specific', () => {
      it('contains intensity labels by language', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Intensity Labels by Language');
        expect(content).toContain('Passive');
        expect(content).toContain('패시브');
        expect(content).toContain('パッシブ');
      });

      it('contains authorization warning section', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Authorization Required');
      });

      it('contains ratatosk-cli detection', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('which ratatosk');
      });

      it('requires attack plan approval', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Approve this attack plan');
      });
    });

    describe('vulchk-codeinspector specific', () => {
      it('references all 5 sub-agents', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-codeinspector', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('vulchk-dependency-auditor');
        expect(content).toContain('vulchk-code-pattern-scanner');
        expect(content).toContain('vulchk-secrets-scanner');
        expect(content).toContain('vulchk-git-history-auditor');
        expect(content).toContain('vulchk-container-security-analyzer');
      });

      it('specifies parallel execution', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-codeinspector', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toMatch(/IN PARALLEL|in parallel|parallel/i);
      });
    });
  });

  describe('agent templates', () => {
    const expectedAgents = [
      { file: 'vulchk-dependency-auditor.md', name: 'vulchk-dependency-auditor', prefix: 'DEP' },
      { file: 'vulchk-code-pattern-scanner.md', name: 'vulchk-code-pattern-scanner', prefix: 'CODE' },
      { file: 'vulchk-secrets-scanner.md', name: 'vulchk-secrets-scanner', prefix: 'SEC' },
      { file: 'vulchk-git-history-auditor.md', name: 'vulchk-git-history-auditor', prefix: 'GIT' },
      { file: 'vulchk-container-security-analyzer.md', name: 'vulchk-container-security-analyzer', prefix: 'CTR' },
      { file: 'vulchk-attack-planner.md', name: 'vulchk-attack-planner', prefix: null },
      { file: 'vulchk-attack-executor.md', name: 'vulchk-attack-executor', prefix: 'HSM' },
    ];

    for (const agent of expectedAgents) {
      describe(agent.name, () => {
        const agentPath = join(TEMPLATES_DIR, 'agents', agent.file);

        it('file exists', () => {
          expect(fse.existsSync(agentPath)).toBe(true);
        });

        it('has valid YAML frontmatter', () => {
          const content = fse.readFileSync(agentPath, 'utf-8');
          const fm = parseFrontmatter(content);
          expect(fm).not.toBeNull();
        });

        it('has required name field matching filename', () => {
          const content = fse.readFileSync(agentPath, 'utf-8');
          const fm = parseFrontmatter(content);
          expect(fm.name).toBe(agent.name);
        });

        it('has description field', () => {
          const content = fse.readFileSync(agentPath, 'utf-8');
          const fm = parseFrontmatter(content);
          expect(fm.description).toBeTruthy();
        });

        it('has model field set to sonnet', () => {
          const content = fse.readFileSync(agentPath, 'utf-8');
          const fm = parseFrontmatter(content);
          expect(fm.model).toBe('sonnet');
        });

        it('has tools field', () => {
          const content = fse.readFileSync(agentPath, 'utf-8');
          expect(content).toMatch(/tools:\s*\n\s+-/);
        });

        if (agent.prefix) {
          it(`uses ${agent.prefix}-{NNN} finding format`, () => {
            const content = fse.readFileSync(agentPath, 'utf-8');
            expect(content).toContain(`${agent.prefix}-{NNN}`);
          });
        }

        it('has substantive instructions (not a placeholder)', () => {
          const content = fse.readFileSync(agentPath, 'utf-8');
          // All agents should have meaningful content (>500 chars)
          expect(content.length).toBeGreaterThan(500);
          expect(content).not.toContain('<!-- Phase');
        });
      });
    }
  });

  describe('config template', () => {
    it('exists and has valid JSON', () => {
      const configPath = join(TEMPLATES_DIR, 'config.json');
      expect(fse.existsSync(configPath)).toBe(true);

      const config = fse.readJsonSync(configPath);
      expect(config).toHaveProperty('language');
      expect(config).toHaveProperty('version');
    });

    it('defaults to English', () => {
      const config = fse.readJsonSync(join(TEMPLATES_DIR, 'config.json'));
      expect(config.language).toBe('en');
    });
  });

  describe('finding format consistency', () => {
    it('all codeinspector agents use consistent severity levels', () => {
      const codeAgents = [
        'vulchk-dependency-auditor.md',
        'vulchk-code-pattern-scanner.md',
        'vulchk-secrets-scanner.md',
        'vulchk-git-history-auditor.md',
        'vulchk-container-security-analyzer.md',
      ];

      for (const file of codeAgents) {
        const content = fse.readFileSync(join(TEMPLATES_DIR, 'agents', file), 'utf-8');
        expect(content).toContain('**Severity**');
        expect(content).toContain('**Category**');
        expect(content).toContain('**Location**');
        expect(content).toContain('**Evidence**');
        expect(content).toContain('**Remediation**');
      }
    });

    it('attack executor uses HSM prefix and required fields', () => {
      const content = fse.readFileSync(
        join(TEMPLATES_DIR, 'agents', 'vulchk-attack-executor.md'),
        'utf-8'
      );
      expect(content).toContain('HSM-{NNN}');
      expect(content).toContain('**Severity**');
      expect(content).toContain('**Vector**');
      expect(content).toContain('**Endpoint**');
      expect(content).toContain('**Evidence**');
      expect(content).toContain('**Remediation**');
    });
  });
});
