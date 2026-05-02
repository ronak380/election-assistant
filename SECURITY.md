# Security Policy

## Supported Versions

We actively provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please **do not open a public issue**. Instead, follow these steps:

1.  **Draft a detailed report:** Include the nature of the vulnerability, steps to reproduce, and potential impact.
2.  **Submit via Private Channel:** Since this is a hackathon project, please reach out to the project maintainers directly via GitHub profile contact information.
3.  **Wait for Response:** We aim to respond within 48 hours to all critical security reports.

## Production Hardening Measures

The Election Assistant implements several industry-standard security patterns:
- **Strict Content Security Policy (CSP):** Mitigates XSS and data injection attacks.
- **Environment Guarding:** Validates all critical API keys at startup to prevent silent failures.
- **Non-Root Execution:** The production Docker image runs as a non-privileged `nextjs` user.
- **AI Safety Filters:** Explicitly configured thresholds to prevent the generation of harmful or non-partisan content.

Thank you for helping keep our citizens' data safe.
