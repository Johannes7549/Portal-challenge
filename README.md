# Partner Portal User Management Service

This project implements a horizontally scalable user management service as per the requirements of the Partner Portal Challenge. It provides core user management functionalities, role-based access control, efficient caching using Redis, and real-time username availability validation with RedisBloom.

## Challenge Overview

The goal was to design and implement a user management service with full CRUD support, RBAC, and efficient caching/validation strategies using Redis. Key aspects included API design, data modeling, authorization, and caching techniques.

## Core Features Implemented

*   **Full User CRUD:** Endpoints for creating, reading, updating, and deleting user entities.
*   **Authentication:** Basic signup and login flow using JWT for issuing authorization tokens.
*   **Role-Based Access Control (RBAC):** Implementation of `admin`, `editor`, and `viewer` roles with a `RolesGuard` and `@Roles()` decorator to enforce permissions based on the defined matrix.
*   **Real-time Username Validation:** A lightweight API endpoint (`GET /validation/username/:username`) for checking username availability using a RedisBloom filter for high performance and reduced database load.
*   **Caching:** Implementation of a caching strategy for read endpoints using `@nestjs/cache-manager` with Redis as the store. Cache invalidation (cache-busting) is performed on mutation operations to ensure data consistency.
*   **Centralized Cache:** Using Redis as a centralized cache store to maintain consistency across potential multiple service instances.

## Technical Stack

*   **Framework:** NestJS
*   **Database:** MongoDB (via Mongoose)
*   **Caching & Validation:** Redis (specifically requiring the RedisBloom module, ideally via Redis Stack)
*   **Authentication:** JWT
*   **Language:** TypeScript

## Setup and Installation

### Prerequisites

*   Node.js (>= 14.x) and npm or yarn
*   MongoDB instance
*   Redis Stack instance (or Redis with RedisBloom module loaded)
*   Docker (recommended for easily running Redis Stack)

### Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Johannes7549/Portal-challenge.git
    cd test-user-management
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory of the project based on the `.env.example`.

    ```env
    MONGODB_URI=mongodb://localhost:27017/your_database_name
    JWT_SECRET=your_jwt_secret_key
    JWT_EXPIRATION=1h # e.g., 1 hour
    REDIS_HOST=localhost # Or your Redis host
    REDIS_PORT=6379 # Or your Redis port
    CACHE_TTL=300 # Default cache TTL in seconds (e.g., 5 minutes)
    ```
    **Make sure to replace placeholder values with your actual configuration.**


4.  **Run the application:**
    ```bash
    npm run start:dev
    # or
    yarn start:dev
    ```
    The application should start and connect to your MongoDB and Redis instances. Look for logs indicating successful connections.

## API Endpoints

All endpoints are prefixed with `/`.

### Authentication (`/auth`)

*   `POST /auth/signup`: Register a new user.
*   `POST /auth/login`: Log in a user and issue a JWT.

### Users (`/users`)

*   `GET /users/all`: Get a list of all users (cached endpoint). Requires authentication and appropriate role (`admin`, `editor`).
*   `GET /users/profile`: Get the profile of the currently authenticated user. Requires authentication.
*   `PATCH /users/:username`: Update an existing user's data. Requires authentication and appropriate role (`admin`, `editor`).
*   `PATCH /users/:username/role`: Update an existing user's role. Requires authentication and `admin` role.
*   `DELETE /users/:username`: Delete a user. Requires authentication and `admin` role.

### Validation (`/validation`)

*   `GET /validation/username/:username`: Check if a username is available in real-time (uses Bloom filter and database fallback).

## Authentication and Authorization (RBAC)

The service uses JWT for authentication. Upon successful login, a JWT is issued, which must be included in subsequent requests (typically in the `Authorization: Bearer <token>` header).

Role-Based Access Control is implemented using:
*   `UserRole` enum (`ADMIN`, `EDITOR`, `VIEWER`) defined in `src/users/enums/user-role.enum.ts`.
*   `@Roles()` decorator to specify required roles for controller endpoints.
*   `RolesGuard` (`src/guards/roles.guard.ts`) to check if the authenticated user's role matches the required roles.

The permissions matrix followed:

| Role   | Read Users   | Update Users   | Delete Users   | Manage Roles   |
| :----- | :----------- | :------------- | :------------- | :------------- |
| Admin  | ✅            | ✅              | ✅              | ✅              |
| Editor | ✅            | ✅              | ❌              | ❌              |
| Viewer | ✅ (public only) | ❌              | ❌              | ❌              |

*Note: Public-only read access for Viewers would require additional logic within the service layer or a separate endpoint to filter user data.*

## Caching Strategy

Caching is implemented for read endpoints using NestJS's `CacheModule` with Redis.
*   `@UseInterceptors(CacheInterceptor)` is applied to read endpoints (`GET /users/all`, `GET /users/profile`) to cache responses.
*   `@CacheKey()` is used to define unique keys for cache entries (e.g., `'users_list'`).
*   A cache-busting strategy is used for data consistency. After any mutation operation (create, update, delete) in `UsersService`, the relevant cache keys (`'users_list'`) are explicitly deleted using `CacheManager.del()`. This ensures that subsequent read requests retrieve fresh data from the database and update the cache.

## Real-time Username Validation

The `/validation/username/:username` endpoint provides real-time username availability checks.
*   It utilizes a Bloom filter stored in Redis (requiring the RedisBloom module).
*   When a username is checked, it first probes the Bloom filter. If the filter indicates the username definitely does not exist, a fast `available: true` response is returned.
*   If the Bloom filter indicates the username *might* exist (due to the probabilistic nature of Bloom filters), a database lookup is performed to confirm availability, ensuring no false positives result in stating a username is available when it's not.
*   New usernames are added to the Bloom filter upon user creation.

## Password Constraints

```{
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }
```

*   Minimum length: 8 characters
*   Requires at least one uppercase letter.
*   Requires at least one lowercase letter.
*   Requires at least one digit.
*   Requires at least one special character.

## User Model Specification

| Field       | Type   | Description                                                                 |
| :---------- | :----- | :-------------------------------------------------------------------------- |
| `email`     | string | (Public) Required, valid email format, globally unique.                     |
| `password`  | string | Required, stored as a hash, must meet defined complexity rules.           |
| `username`  | string | (Public) Required, globally unique.                                         |
| `fullName`  | string | (Public) Optional, human-friendly display name.                             |
| `role`      | Enum   | (Private) Required, one of `admin`, `editor`, `viewer`.                     |
| `createdAt` | Date   | (Private) Required, timestamp when created.                                 |
| `updatedAt` | Date   | (Private) Required, timestamp when last modified.                           |

## Future Improvements

*   Implement more granular permission checks beyond just roles (e.g., using a library like `casl`).
*   Add comprehensive unit and integration tests.
*   Improve error handling and logging.
*   Consider more advanced caching patterns (e.g., write-through for writes).
