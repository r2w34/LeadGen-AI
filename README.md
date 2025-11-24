
# LeadGen AI - Developer Guide

## 1. Running Tests
This project includes a suite of automated tests to verify the Lead Finder pipeline, Authentication persistence, and Dashboard rendering.

To run tests (requires Node environment):
```bash
npm test
```
*Note: Since this is a browser-based React app, the tests provided in `__tests__` are designed to be run with a test runner like Jest/Vitest. If running in a browser-only environment, use the "Developer Mode" in Settings to view telemetry logs.*

## 2. Developer Mode
1. Go to **Settings > Developer**.
2. Toggle "Enable Developer Tools".
3. You will see a live telemetry log of API calls, memory usage, and scan latencies.

## 3. Key Features Repaired
- **Anti-Mirroring**: The AI no longer suggests your own company as a lead.
- **Dashboard Scroll**: Fixed `overflow: hidden` bug on the main container.
- **Persistence**: Added a Singleton DB wrapper to prevent data loss on hot-reload.
