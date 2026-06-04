# Finance Command Center

Finance Command Center is a responsive personal expense tracker and portfolio dashboard built with React, Tailwind CSS, Recharts, and Google Apps Script. It is designed as an atmospheric digital journal for logging expenses, income, assets, budgets, recurring commitments, and portfolio values from a single polished interface.

The app combines quick daily entry flows with richer financial context: budget limits, category-level progress, needs/wants/savings allocation tracking, period-based analytics, expandable graph insights, recurring expense reminders, and a recent journal view.

## Features

- Fast expense, income, and asset logging
- Native date picker for backdated or future-dated entries
- Category-first expense flow with payment account selection
- Editable custom expense categories and account sources
- Optional description field with subtle prompt hints
- Recent journal showing only category, amount, and description
- Monthly budget setup with category-specific limits
- Recurring expense tracker for rent, SIPs, bills, subscriptions, and more
- Needs / Wants / Savings allocation targets
- Weekly, monthly, and yearly dashboard views
- Total Burn, Budget Left, and Allocation metric cards
- Recharts area chart, category pie chart, and allocation tracker
- Expandable graph modals with detailed categorized logs
- Portfolio pulse section for liquid accounts, stocks, and mutual funds
- Asset sync support for Google Sheets cells C16 and C17
- REST-based Google Apps Script backend bridge
- Responsive layouts tested across desktop, tablet, iOS-sized, and Android-sized viewports
- Soft paper-inspired UI with frosted glass panels and ambient motion

## Tech Stack

- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Google Apps Script
- Google Sheets as the backend data store

## Backend

The frontend communicates with a deployed Google Apps Script Web App through standard REST requests.

- `GET` reads dashboard data, accounts, categories, budgets, recurring rules, transactions, and asset values.
- `POST` writes expense entries, income entries, asset updates, category changes, account changes, budgets, and recurring rules.

Google Sheets acts as the lightweight database layer, while Apps Script works as the serverless adapter.

## Design Direction

The interface uses a soft eggshell paper background, frosted glass containers, serif editorial headers, and monospace financial tokens. It is built to feel more like a calm digital money journal than a generic finance spreadsheet.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Quality Checks

The app has an automated UAT harness covering:

- Desktop, laptop, tablet, iOS-sized, and Android-sized layouts
- Small mobile widths and landscape viewports
- Journal filtering
- Instant expense logging
- Custom categories and accounts
- Budget and recurring sync
- Graph expansion modals
- Invalid input and edge cases
- Zero budget and zero split target states
- Horizontal overflow checks
