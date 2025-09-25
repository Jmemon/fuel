# LLM Code Generation Structure

This document outlines the main phases used to design updates for an LLM to implement.

## Phase 1: Requirements Design

First we design the requirements files. Write something up, go back-and-forth with claude until you have a series of requirements files that when implemented in sequence will get you to the full app.

### Requirements Generation Prompt

```
I need you to create a comprehensive requirements specification that breaks down the application into implementable phases.

Consider:
- What are the core foundational features that everything else depends on?
- What is the logical sequence of implementation that minimizes rework?
- What are the natural breaking points where we can have a working application at each stage?

For each phase, create a detailed requirements document that includes:
1. **Phase Overview**: What this phase accomplishes and why it comes at this point
2. **Core Features**: Specific functionality to be implemented
3. **Technical Requirements**: Database schemas, APIs, data structures, etc.
4. **User Experience**: How users interact with these features
5. **Dependencies**: What from previous phases this builds on
6. **Acceptance Criteria**: How we know this phase is complete

Each phase should be a meaningful milestone that could theoretically ship as a minimal but useful version.

Please create requirements files for phases that build up to the full application, with each file focused on a specific version increment (e.g., v0.3, v0.5, v0.7, etc.).
```

### Example Structure
```
├── 1-requirements
│   ├── fuel-v0-3-database.md
│   ├── fuel-v0-5-frontend-backend.md
│   ├── fuel-v0-7-local-deploy.md
│   ├── fuel-v0-8-fuel-events.md
│   ├── fuel-v1-0-local-git-integration.md
│   ├── fuel-v1-2-claude-code-integration.md
│   ├── fuel-v1-5-ai-conversations.md
│   ├── fuel-v1-8-oauth.md
│   └── fuel-v2-0-social-media.md
```

## Phase 2: Schema Files

Once we are at a good point with requirements, we create schema files. These should contain every file, class, function, method, with a description of what they do, and what classes/functions they depend on (ie will call/access).

### Schema Generation Prompt

```
Based on the requirements documents, I need you to create detailed technical schemas for the implementation. These schemas should serve as the technical blueprint that defines every component needed.

For each file that will be created, provide:

**File Structure:**
- File path and name
- Import statements and dependencies
- Class signatures with all properties and methods
- Function signatures with parameters, return types, and dependencies
- Database schemas, API endpoints, and data structures as relevant

**Dependency Mapping:**
- List the functions/classes each component will call or access
- Specify which files this component depends on
- Include external library dependencies

**Purpose Description:**
- Concise but precise description of what each function/method does
- How it fits into the overall system architecture

**Format Example:**
```typescript
// src/services/user.service.ts
import { Database } from './database.service';
import { Logger } from '../utils/logger';

export class UserService {
    constructor(private db: Database, private logger: Logger) {}

    async createUser(userData: UserData): Promise<User>
    // calls: [db.users.create, logger.info]
    // purpose: validates user data and creates new user record in database

    async getUserById(id: string): Promise<User | null>
    // calls: [db.users.findById, logger.debug]
    // purpose: retrieves user by ID with error handling and logging
}

dependencies: Database from ./database.service, Logger from ../utils/logger
```

Please create comprehensive schemas covering all the components needed for this phase of the application.
```

### Example Structure
```
├── 2-schema
│   ├── v0-3-database.md
│   ├── v0-5-frontend-backend.md
│   └── v0-7-local-deploy.md
```

## Phase 3: Overview Document

Once we have the schemas, we write an overview doc as a sort of high-level key for the AI to check. For now it really just contains the proposed file structure and big architectural details. The prompt to generate this file receives the schema files as context.

### Overview Generation Prompt

```
Based on the detailed schemas provided, create a high-level overview document that serves as an architectural guide and implementation roadmap.

This overview should include:

**1. Project Structure:**
Complete directory tree showing where every file will be located, organized logically by feature/layer:
```
src/
├── components/
│   ├── ui/
│   └── features/
├── services/
├── utils/
├── types/
└── config/
```

**2. Architecture Overview:**
- High-level system architecture (client-server, microservices, etc.)
- Data flow between major components
- Key design patterns and principles being followed
- Technology stack and why each piece was chosen

**3. Implementation Order:**
- Recommended sequence for building components
- Which components can be built in parallel
- Key dependencies that must be completed first

**4. Key Integration Points:**
- How major systems connect (database, API, frontend)
- External service integrations
- Authentication/authorization flow

**5. Development Guidelines:**
- Coding standards and conventions to follow
- Testing approach
- Error handling patterns

This document should serve as the reference point for understanding the overall system before diving into specific implementation details.
```

### Location
It sits at the root of the spec-design directory:
```
├── OVERVIEW-v0-7.md
```

## Phase 4: Testing & Implementation

From here we do two things. The schemas should have enough info about classnames, function names, method names, variables, the database schema, indexes so that we will know what needs to be called and when. The requirements docs should have more purpose information. And the OVERVIEW file should ground us in a specific project structure.

### 4a: E2E Test Design

First we generate a file with full design of e2e tests. Not too many to keep things simple, a smaller number of comprehensive tests. In the prompt, our first section is to describe the tests in language and what the idea is, then to design them, then to exhaustively design them. This prompt receives relevant requirements docs, schema docs, and overview file as context.

```
├── 3-tests
│   └── e2e-v0-7.md
```

### 4a: E2E Test Design

First we generate a file with full design of e2e tests. Not too many to keep things simple, a smaller number of comprehensive tests. In the prompt, our first section is to describe the tests in language and what the idea is, then to design them, then to exhaustively design them. This prompt receives relevant requirements docs, schema docs, and overview file as context.

#### E2E Test Generation Prompt

```
Based on the requirements, schemas, and overview document, design comprehensive end-to-end tests that validate the core user workflows and system integration.

**Test Strategy:**
Create a focused set of high-value E2E tests that:
- Cover the primary user journeys from the requirements
- Validate integration between all major system components
- Test critical error scenarios and edge cases
- Verify data flow from frontend through backend to database

**For each test, provide:**

**1. Test Description:**
- Name and purpose in plain language
- User story or scenario being tested
- Why this test is critical to system functionality

**2. Test Design:**
- Step-by-step user actions
- Expected system responses at each step
- Data setup requirements
- Cleanup procedures

**3. Technical Implementation:**
- Specific API endpoints, database queries, or UI elements to interact with
- Test data fixtures needed
- Assertions to verify correct behavior
- Error conditions to test

**Example Format:**
```
## Test: Complete User Registration and Login Flow

**Purpose:** Validates that new users can register, receive verification, and log in successfully

**User Story:** As a new user, I want to create an account and access the application

**Steps:**
1. Navigate to registration page
2. Fill out registration form with valid data
3. Submit form and verify success message
4. Check database for user record creation
5. Simulate email verification process
6. Log in with new credentials
7. Verify user dashboard loads correctly

**Technical Details:**
- API: POST /api/auth/register, GET /api/auth/verify, POST /api/auth/login
- Database: Verify user record in users table with correct fields
- UI: Check elements with data-testid="register-form", "dashboard-header"
```

Focus on creating 3-5 comprehensive tests that provide maximum coverage of critical functionality.
```

```
├── 3-tests
│   └── e2e-v0-7.md
```

### 4b: Implementation Guide

Then we generate an exhaustive implementation guide. It should go step-by-step in how the AI should generate everything. With full code, files, etc. The LLM should be able to generate the version directly from this file. Ensure you actually read this file to the point of full understanding, critiquing where needed, and getting it to a good point. I also had it include notes on how to add new features when the time comes.

```
├── 4-impl
│   ├── HOW-TO-ADD-NEW-LOG-TYPE.md
│   ├── UX-UPDATE-THOUGHTS.md
│   └── v0-7.md
```