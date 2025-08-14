# Schedule Manager Documentation Hub

Welcome to the central documentation for the Schedule Manager application. This document provides a high-level overview of the project and links to more detailed documentation files for specific architectural and component-level information.

## 1. Project Overview

The Schedule Manager is a sophisticated web application designed to handle the complex needs of scheduling, real-time work tracking, and performance analysis. It features a modern, responsive user interface with both a live operational view for day-to-day management and a strategic **PlanMode** for long-term planning.

### Key Features:

*   **Operational Mode**: Real-time dashboard, interactive schedule grid, and live check-in/out functionality.
*   **PlanMode**: A strategic planning layer for creating, analyzing, and comparing draft schedules (`ScheduleProposals`) against teacher availability (`CapacityProfiles`) without affecting the live schedule.
*   **Data-Driven UI**: All components are driven by a centralized state management system, ensuring consistency and reliability.
*   **Modern Tech Stack**: Built with React, TypeScript, and Tailwind CSS for a performant and maintainable codebase.

---

## 2. Detailed Documentation

For a deeper dive into specific aspects of the application, please refer to the following documents:

*   **[README.md](./README.md)**: The main project README, containing information on features, technology stack, and setup.

*   **[UI Components Guide](./ui_components.md)**: A comprehensive breakdown of every React component, its props, state, and purpose within the application's UI. This is the reference for understanding the view layer.

*   **[Data & Architecture Guide](./data_ops.md)**: An in-depth guide to the application's architecture, including data models, state management with the `useSchedule` hook, the mock API service, and key data flow workflows. This is the essential guide for understanding how data is managed and processed.

---

## 3. Architectural Principles

The application is built on a set of core principles that ensure it is scalable, maintainable, and robust:

1.  **Single Source of Truth**: The mock API (`services/api.ts`) is the canonical source for all data, while the `useSchedule` hook is the single source of truth for the UI's state.
2.  **Uni-directional Data Flow**: State flows down from hooks to components, and events flow up from components to hooks, creating a predictable and debuggable application lifecycle.
3.  **Strict Separation of Concerns**: The view (components), logic (hooks), and services (API) are clearly separated, making the system modular and easy to reason about.

By adhering to these principles, the Schedule Manager provides a powerful and reliable user experience while maintaining a clean and understandable codebase.
