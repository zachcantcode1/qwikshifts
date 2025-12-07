# QwikShifts Project Analysis

## Project Overview

This is a modern, high-performance employee scheduling and management application named **QwikShifts**. It's a monorepo project built with a focus on speed and user experience.

-   **Frontend:** The frontend is a React application built with Vite and styled with Tailwind CSS and Shadcn UI. It uses `react-router-dom` for routing and has features like a schedule board, time off requests, and employee management.
-   **Backend:** The backend is a lightweight Hono server running on Bun. It uses a SQLite database (`bun:sqlite`) for data persistence and provides a RESTful API for the frontend.
-   **Shared Code:** A `core` package contains shared TypeScript types and Zod schemas used by both the frontend and backend, ensuring data consistency across the applications.
-   **Monorepo:** The project is structured as a monorepo using Turborepo to manage the `web` and `api` applications, as well as the shared `core` package.

## Building and Running the Project

The project uses Bun as the runtime and package manager.

### Prerequisites

-   [Bun](https://bun.sh/) (v1.0.0 or later)

### Installation and Setup

To install dependencies and build the project, run the following command from the root directory:

```bash
bun run setup
```

This command will install all dependencies and then build the individual applications.

### Development

To run the frontend and backend applications in development mode with hot-reloading, use the following command from the root directory:

```bash
bun run dev
```

-   The API will be available at `http://localhost:3000`.
-   The web application will be available at `http://localhost:5173`.

### Production

To build and run the applications in production mode, use the following command from the root directory:

```bash
bun run start
```

### Database

The project uses a SQLite database. To reset the database, you can run the following command from the root directory:

```bash
bun run db:reset
```

## Development Conventions

-   **TypeScript:** The entire codebase is written in TypeScript.
-   **Zod:** Zod is used for schema validation in the `core` package, ensuring data integrity between the frontend and backend.
-   **ESLint:** The project uses ESLint for code linting. You can run the linter with `bun run lint` in the `apps/web` directory.
-   **Monorepo Structure:** The project is organized as a monorepo with `apps` and `packages` directories.
    -   `apps/web`: Contains the frontend React application.
    -   `apps/api`: Contains the backend Hono application.
    -   `packages/core`: Contains shared code, primarily TypeScript types and Zod schemas.
-   **Authentication:** The frontend uses a simple authentication mechanism where the user ID is stored in local storage. The backend has a middleware to protect most of the API routes.
