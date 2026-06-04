# LogXpens — Life Expenses Dashboard

**LogXpens** is a personal finance and expense tracking dashboard built to help users track expenses, income, assets, budgets, recurring payments, and financial insights in one clean interface.

The project is designed as a practical financial dashboard where users can understand their spending behaviour, monitor monthly budgets, review financial patterns, and get a clear view of their overall money flow.

## Live Website

The project is deployed on Vercel.

**Live Demo:** https://logxpens.vercel.app/

## Repository

**GitHub Repository:** https://github.com/connectsumitp/Life-Expenses

## Project Overview

Managing personal finances can quickly become messy when expenses are spread across food, rent, travel, subscriptions, health, investments, and multiple accounts.

LogXpens solves this problem by providing a dashboard-style experience where users can:

* Add expenses, income, and assets
* Categorize transactions
* Track monthly spending
* Compare expenses against budgets
* Monitor recurring payments
* View visual charts and summaries
* Review financial activity across different time periods
* Understand how money is distributed across needs, wants, and savings

The goal of this project is not just to record transactions, but to turn daily financial activity into meaningful and actionable insights.

## Key Features

### Expense Tracking

Users can record daily or monthly expenses with relevant details such as amount, category, date, account, and notes.

Example expense categories include:

* Daily Essentials
* Life Enjoyment
* Commuting
* Home & Utilities
* Health & Fitness
* Personal Care
* Subscriptions
* Investments

This helps users understand where their money is going and which categories are consuming the most budget.

### Income Tracking

The dashboard supports income entries from multiple sources.

Example income sources include:

* Salary
* Freelance Income
* Stock Profit
* Mutual Fund Gain
* Interest
* Refund
* Gift
* Other Income

By tracking income along with expenses, users can understand their actual monthly cash flow.

### Asset Tracking

LogXpens also includes asset and account tracking to provide a broader financial view.

Example accounts and assets include:

* SBI Account
* HDFC Account
* Cash Reserve
* Stocks
* Mutual Funds

This makes the dashboard more useful than a basic expense tracker because it also gives visibility into assets and balances.

### Budget Management

The app includes category-wise budget planning so users can compare planned spending against actual spending.

Budget categories can include:

* Daily Essentials
* Life Enjoyment
* Commuting
* Home & Utilities
* Health & Fitness
* Personal Care
* Subscriptions
* Investments

This helps users stay aware of overspending and make better financial decisions.

### Needs, Wants & Savings Allocation

The dashboard follows a simple financial allocation model:

```text
Needs: 50%
Wants: 30%
Savings: 20%
```

This gives users a quick way to understand whether their spending is balanced or whether they are over-indexing on lifestyle expenses.

### Recurring Expense Tracking

LogXpens supports recurring financial rules for predictable payments such as:

* Rent
* SIP
* Phone bills
* Weekly essentials
* Subscriptions

This helps users plan ahead for expenses that happen regularly.

### Time-Based Financial Views

The dashboard supports different review periods:

* Weekly view
* Monthly view
* Yearly view

This allows users to analyse both short-term and long-term financial trends.

### Visual Analytics

The project uses charts and visual components to make financial data easier to understand.

The dashboard can show:

* Expense trends
* Category-wise spending
* Budget comparison
* Income vs expense summary
* Asset distribution
* Savings overview

Visualisation helps users quickly understand their financial behaviour without manually reading every transaction.

### Notes & Filters

Users can add notes to financial entries for better context.

Example notes:

* Grocery shopping
* Cab to office
* Monthly SIP
* Gym membership
* Phone bill
* Subscription payment
* Food delivery

The app also supports filtering and reviewing entries based on category, time period, type, and notes.

### Local Storage Support

The application can store financial setup and preferences in browser local storage.

This can include:

* Accounts
* Categories
* Budget setup
* Allocation targets
* Recurring rules
* User preferences

This allows the app to work without requiring a full backend setup.

### Optional Google Apps Script Integration

The project includes support for a Google Apps Script workflow.

This can be used for external data storage, automation, or Google Sheets-based syncing.

An environment variable can be configured as:

```env
VITE_APPS_SCRIPT_URL=your_google_apps_script_web_app_url
```

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* CSS

### Charts & Visualisation

* Recharts

### Icons

* Lucide React

### Optional Backend / Automation

* Google Apps Script

### Deployment

* Vercel

### Development Tools

* GitHub
* GitHub Desktop
* VS Code
* npm

## Project Structure

```bash
Life-Expenses/
│
├── apps-script/
│   └── Code.gs
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
│
├── .gitignore
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/connectsumitp/Life-Expenses.git
```

### 2. Move into the project folder

```bash
cd Life-Expenses
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the app in your browser

Vite usually runs the app at:

```bash
http://localhost:5173
```

## Available Scripts

### Start development server

```bash
npm run dev
```

### Create production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Environment Variables

To connect the app with Google Apps Script, create a `.env` file in the root directory and add:

```env
VITE_APPS_SCRIPT_URL=your_google_apps_script_web_app_url
```

If this environment variable is not configured, the app can still be used with local/demo data depending on the setup.

## How to Use

1. Open the LogXpens dashboard.
2. Add a new transaction.
3. Select whether it is an expense, income, or asset entry.
4. Choose the right category.
5. Select the account linked to the transaction.
6. Add the amount, date, and note.
7. Review your dashboard summary.
8. Check category-wise spending.
9. Compare actual spending with budget.
10. Review weekly, monthly, or yearly financial trends.
11. Use insights to improve savings and reduce unnecessary expenses.

## Example Transaction

```json
{
  "amount": 1280,
  "category": "Daily Essentials",
  "type": "expense",
  "account": "SBI Account",
  "date": "2026-06-01",
  "note": "Groceries"
}
```

## Example User Questions the Dashboard Can Help Answer

LogXpens can help users answer questions like:

* How much did I spend this month?
* Which category had the highest expense?
* Am I spending too much on wants?
* How much money went into investments?
* What are my recurring expenses?
* How much income did I receive this month?
* What is my current asset distribution?
* Am I staying within my monthly budget?
* How much am I saving compared to my income?

## Product Thinking Behind LogXpens

LogXpens is designed with a product-first mindset.

The dashboard is not only about adding numbers. It is about helping users build better financial awareness.

The core product goals are:

* Make personal finance easy to understand
* Reduce confusion around expenses
* Give users a clear monthly money snapshot
* Help identify overspending patterns
* Encourage budgeting discipline
* Show financial insights visually
* Combine expenses, income, assets, and budgets in one place

## Possible Product Metrics

If this project were expanded into a full product, the following metrics could be tracked:

* Daily active users
* Monthly active users
* Number of transactions added per user
* Budget completion rate
* Category-wise overspending
* Savings percentage
* Recurring payment tracking rate
* User retention
* Most used dashboard views
* Average monthly expense tracked
* Monthly active budget users

## Future Improvements

Possible future enhancements include:

* User authentication
* Cloud database integration
* Google Sheets sync
* CSV import and export
* PDF monthly financial reports
* AI-based spending insights
* Budget alerts
* Recurring payment reminders
* Mobile-first PWA version
* Dark mode
* Multi-user household expense tracking
* Goal-based savings tracker
* Investment return tracker
* Net worth dashboard
* UPI/SMS transaction parser
* Bank statement upload
* Auto-categorisation of expenses
* Monthly financial health score

## Deployment

The project is deployed on Vercel.

**Live Website:** https://logxpens.vercel.app/

To deploy manually:

```bash
npm run build
```

Then connect the GitHub repository to Vercel and deploy the production build.

## Screenshots

Add screenshots here after capturing the live dashboard.

```md
![LogXpens Dashboard](./public/dashboard.png)
```

Suggested screenshots:

* Main dashboard
* Add transaction section
* Budget overview
* Category chart
* Monthly expense review
* Asset overview

## Learnings from This Project

This project demonstrates:

* Frontend development with React
* Vite-based project setup
* Tailwind CSS styling
* Dashboard UI design
* Financial data categorisation
* State and local storage handling
* Chart-based visualisation
* Product thinking for personal finance
* Deployment using Vercel
* GitHub project documentation

## Author

**Sumit Pandey**

GitHub: [@connectsumitp](https://github.com/connectsumitp)

Live Project: [LogXpens](https://logxpens.vercel.app/)

## License

This project is currently open for learning, personal use, and portfolio demonstration.

You can add an MIT License later if you want to make usage rights clearer.

## Final Note

LogXpens is built around a simple idea: personal finance should feel clear, visual, and actionable.

The project brings expenses, income, assets, budgets, recurring payments, and financial insights into a single dashboard so users can understand their money better and make smarter financial decisions.
