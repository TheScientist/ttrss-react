# Application Architecture

This document provides an overview of the project's architecture, designed to help React beginners understand the codebase.

## Core Technologies

*   **React**: The core library for building the user interface.
*   **Vite**: The build tool and development server.
*   **TypeScript**: For static typing, improving code quality and maintainability.
*   **MUI (Material-UI)**: The component library used for UI elements like buttons, dialogs, and layout.

## Project Structure

The `src` folder is the heart of the application and is organized as follows:

*   `src/api/`: Contains all the logic for communicating with the TT-RSS API. `apiService.ts` is a singleton service that handles all API requests.
*   `src/assets/`: Static assets like images or fonts would go here.
*   `src/components/`: Reusable React components used throughout the application (e.g., `ArticleRenderer.tsx`, `ConfirmationDialog.tsx`).
*   `src/contexts/`: React Context providers for managing global state. This is how different parts of the app share data without passing props down through many levels.
    *   `SettingsContext.tsx`: Manages user settings like theme and API credentials.
    *   `FeedContext.tsx`: Manages the feed/category tree and unread counts.
    *   `HeadlinesContext.tsx`: Manages the list of articles for a selected feed.
    *   `SelectionContext.tsx`: Manages the currently selected feed and article.
*   `src/hooks/`: Custom React hooks that contain reusable stateful logic. For example, `useFeeds.ts` encapsulates the logic for fetching and managing feed data.
*   `src/pages/`: Top-level components that correspond to a page or view in the app (e.g., `MainPage.tsx`, `LoginPage.tsx`).
*   `src/store/`: Handles persistent storage, like saving settings to the browser's `localStorage`.
*   `src/types/`: Contains TypeScript type definitions used across the project.
*   `main.tsx`: The entry point of the application.

## Data Flow

1.  **Initialization**: When the app starts, `SettingsProvider` loads user settings from local storage.
2.  **Login**: The user enters their credentials on the `LoginPage`, which are used by `apiService.ts` to log in to the TT-RSS API and get a session ID.
3.  **Fetching Data**:
    *   `FeedProvider` uses the `useFeeds` hook to fetch the category/feed tree and unread counters.
    *   When a user clicks a feed, `SelectionContext` updates the selected feed.
    *   `HeadlinesProvider` detects the change in the selected feed and fetches the corresponding articles.
4.  **Rendering**: Components subscribe to the contexts they need. When context data changes (e.g., new articles are loaded), the components automatically re-render to display the new data.

## State Management

This project uses a combination of React's built-in state management tools:

*   **`useState`**: For local component state.
*   **`useContext`**: For global state that needs to be shared across many components. This avoids "prop drilling."

This architecture keeps a clean separation of concerns, making the app easier to understand, maintain, and extend.
