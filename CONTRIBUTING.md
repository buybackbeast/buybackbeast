# Contributing

BUYBACKBEAST welcomes calculation fixes, data-source improvements, accessibility work, and focused product changes.

## Before opening a pull request

1. Open an issue that explains the research problem or data discrepancy.
2. Keep executed value capture separate from announced program budgets.
3. Do not count a bought-and-burned token twice as both a buyback and a direct burn.
4. Use the same USD measurement date for market cap, FDV, and forward unlock value.
5. Add tests for every formula or ranking change.

## Local development

```bash
npm install
npm run dev
```

Run the full check before submitting:

```bash
npm run lint
npm test
npm run build
```

## Data contributions

Prefer sources in this order:

1. Onchain transactions or protocol dashboards
2. Executed governance reports and treasury disclosures
3. Established data providers with a clear methodology
4. Announcements, labeled as announcements and excluded from executed totals

Each value should include a period, currency, measurement date, and source URL. Explain any conversion or annualization.

## Pull requests

Keep each pull request narrow enough to review. Explain the before and after behavior, link the issue, and list the checks you ran.
