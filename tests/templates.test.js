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

        it('contains report language reference', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          expect(content).toContain('Report Language Reference');
          expect(content).toContain('English (en)');
          expect(content).toContain('Korean (ko)');
        });

        it('contains severity labels', () => {
          const content = fse.readFileSync(skillPath, 'utf-8');
          expect(content).toContain('Severity Labels');
          expect(content).toContain('Critical');
          expect(content).toContain('치명적');
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
      it('contains intensity labels', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Intensity Labels');
        expect(content).toContain('Passive');
        expect(content).toContain('패시브');
      });

      it('contains authorization warning section', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Authorization Required');
      });

      it('contains ratatosk-cli detection', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('npm list');
        expect(content).toContain('@letsur-dev/ratatosk-cli');
      });

      it('requires attack plan approval', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Approve this attack plan');
      });

      it('contains workspace initialization', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('mkdir -p .vulchk/hacksim');
        expect(content).toContain('methodology.json');
      });

      it('contains session detection', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('session.json');
        expect(content).toContain('Session Detection');
      });

      it('contains incremental mode logic', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Incremental Mode');
        expect(content).toContain('git diff');
        expect(content).toContain('scenarios_filter');
      });

      it('contains Two-Pass execution model', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Pass 1');
        expect(content).toContain('Pass 2');
        expect(content).toContain('Pass 3');
        expect(content).toContain('Two-Pass Model');
      });

      it('contains methodology section in report template', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('{Methodology}');
        expect(content).toContain('{Execution Summary}');
        expect(content).toContain('{Attack Scenario Coverage}');
        expect(content).toContain('{Tools Used}');
      });

      it('reads phase files for report assembly', () => {
        const skillPath = join(TEMPLATES_DIR, 'skills', 'vulchk-hacksimulator', 'SKILL.md');
        const content = fse.readFileSync(skillPath, 'utf-8');
        expect(content).toContain('Collect Phase Results');
        expect(content).toContain('.vulchk/hacksim/phases/');
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

        it('has model field set to sonnet or haiku', () => {
          const content = fse.readFileSync(agentPath, 'utf-8');
          const fm = parseFrontmatter(content);
          expect(['sonnet', 'haiku']).toContain(fm.model);
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

    it('attack planner has bash and write tools', () => {
      const content = fse.readFileSync(
        join(TEMPLATES_DIR, 'agents', 'vulchk-attack-planner.md'),
        'utf-8'
      );
      expect(content).toMatch(/tools:\s*\n(\s+-\s+\w+\n)*\s+-\s+bash/);
      expect(content).toMatch(/tools:\s*\n(\s+-\s+\w+\n)*\s+-\s+write/);
    });

    it('attack executor has bash and write tools', () => {
      const content = fse.readFileSync(
        join(TEMPLATES_DIR, 'agents', 'vulchk-attack-executor.md'),
        'utf-8'
      );
      expect(content).toMatch(/tools:\s*\n(\s+-\s+\w+\n)*\s+-\s+bash/);
      expect(content).toMatch(/tools:\s*\n(\s+-\s+\w+\n)*\s+-\s+write/);
    });

    it('attack planner writes persistent site analysis and scenarios files', () => {
      const content = fse.readFileSync(
        join(TEMPLATES_DIR, 'agents', 'vulchk-attack-planner.md'),
        'utf-8'
      );
      expect(content).toContain('site-analysis.md');
      expect(content).toContain('attack-scenarios.md');
      expect(content).toContain('attack-plan.md');
      expect(content).toContain('AS-001');
    });

    it('attack executor supports phase-based execution', () => {
      const content = fse.readFileSync(
        join(TEMPLATES_DIR, 'agents', 'vulchk-attack-executor.md'),
        'utf-8'
      );
      expect(content).toContain('**Phase**');
      expect(content).toContain('**Workspace**');
      expect(content).toContain('scenarios_filter');
      expect(content).toContain('methodology.json');
    });

    it('attack executor writes results to phase files', () => {
      const content = fse.readFileSync(
        join(TEMPLATES_DIR, 'agents', 'vulchk-attack-executor.md'),
        'utf-8'
      );
      expect(content).toContain('phase-{N}-{phase}.md');
      expect(content).toContain('Phase Summary');
    });

    it('attack executor uses workspace instead of /tmp/ for session state', () => {
      const content = fse.readFileSync(
        join(TEMPLATES_DIR, 'agents', 'vulchk-attack-executor.md'),
        'utf-8'
      );
      expect(content).not.toContain('/tmp/vulchk-session');
      expect(content).toContain('VULCHK_WORKSPACE');
    });
  });
});
