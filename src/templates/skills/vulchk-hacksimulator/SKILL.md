---
name: vulchk-hacksimulator
description: "Run simulated penetration testing against a web application. Use when the user wants to test their running application for exploitable vulnerabilities, perform security testing against a URL, or simulate attacks. Triggers: /vulchk.hacksimulator, 'pentest', 'hack simulation', 'penetration test'."
allowed-tools: [Bash, Read, Grep, Glob, WebSearch, WebFetch, Task]
---

# VulChk Hack Simulator

<!-- Phase 3 will replace this placeholder with full simulation instructions -->

This skill performs simulated penetration testing against a target web application.

## Capabilities (to be implemented)

- URL-based or local execution targeting
- Scan intensity selection (passive / active / aggressive)
- Attack plan generation with user approval
- Browser automation via ratatosk-cli
- HTTP fetch and API endpoint probing
- Prior codeinspector report integration
- Comprehensive attack logging

## Output

Report written to `./security-report/hacksimulator-{timestamp}.md`
