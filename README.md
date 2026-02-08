# Stratum - The Action Planner

Stratum is a strategic execution tool designed to bridge the gap between high-level ambition and daily action. By breaking large goals into scheduled sub-actions, it provides a clear roadmap for progress without the clutter of traditional to-do lists.

---

## Core Purpose: From "Goal" to "Execution"

Most planners fail because they don't bridge the gap between what you want and when you’ll do it. Stratum solves this by:

- **Defining the Plan:** Setting a high-level goal within a specific date range.
- **Structuring Execution:** Breaking that goal into concrete, actionable steps.
- **Visualizing Momentum:** Real-time progress bars that show exactly how close a goal is to completion based on action states.

This approach encourages strategic execution instead of reactive task completion.

---

## Key Features

- **🎯 Goal-Oriented Planning**  
  Create Plans (the "What") and define their lifespan with a selected Date Range. This keeps your goals time-bound and realistic.

- **⚡ Action-Level Execution**  
  Within each plan, create specific Actions. Manage the lifecycle of every task with three distinct states:
  - 🟡 Pending: The task is scheduled but not yet addressed.
  - 🟢 Done: The task is completed.
  - 🔴 Cancel: The task is no longer relevant or achievable within this plan's scope.

- **📊 Real-Time Progress Tracking**  
  No more guessing. The interface calculates a Progress Percentage for every plan automatically.
  
  Logic: Progress is derived from the ratio of 'Done' actions against the total number of active actions in the plan.

- **☁️ Seamless Cloud Sync**  
  Powered by Firebase Firestore, your plans and progress stay synced across all your devices in real-time.

- **📱 PWA (Progressive Web App)**  
  - **Installable:** Add to mobile home screen or desktop taskbar.

  - **Offline Ready:** Access your plans even with a spotty internet connection.

  - **Native Feel:** Fast loading times and app-like navigation.

---

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Icons**: Lucide-React
- **Backend / Storage**: Firebase
  - Authentication
  - Firestore

---

## Future Roadmap

This project is a **work in progress**. Planned improvements include:

- Optional daily sub-task breakdown
- Enhanced historical productivity analytics
- Dark mode support
- Custom tagging and categorization of action types

---

## Development Notes

This app focuses on Strategic Outcomes. Use, modify, and extend it at your own discretion.

--

## ⚠️ Disclaimer

- **AI-Generated Foundation:** This application was built with AI assistance for personal productivity and experimentation.
- **Security First:** Not production-ready. Users must manually review Firebase security rules and API key restrictions before deployment.
- **Privacy:** Avoid entering sensitive or proprietary data without a comprehensive security audit.