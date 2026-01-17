# Project Context

## Purpose

Hunfly is a real-time AI sales copilot designed to assist sales representatives during live video calls (Google Meet / Zoom), providing contextual guidance, objection handling support, and next-best-action suggestions while the conversation is happening.

The core objective is to increase deal progression, win rate, and seller efficiency, without replacing existing CRMs. Hunfly operates as an intelligence layer on top of sales calls, not as a system of record.

Key outcomes:
- Improve the percentage of meetings that advance in the funnel
- Reduce seller cognitive load during live calls
- Standardize sales quality across teams
- Provide managers with visibility and governance over sales conversations

Hunfly is a B2B SaaS sold to sales leaders and executives, while being used daily by sales reps.

---

## Tech Stack

Primary technologies (MVP with scalability in mind):

Frontend:
- TypeScript
- React (Vite)
- TailwindCSS
- Shadcn/UI
- Browser Extension (Chromium-based)

Backend:
- Node.js (TypeScript)
- Express (thin API layer)
- WebSocket for real-time communication
- REST APIs for non-real-time operations

Data & Auth:
- Supabase (Auth + Postgres)
- Drizzle ORM

AI & Processing:
- External LLM providers abstracted behind service interfaces
- Streaming-friendly inference architecture

Infrastructure:
- Modular monolith for MVP
- Clear boundaries for future service extraction

---

## Project Conventions

### Code Style

- TypeScript everywhere
- No use of `any`
- Explicit code over clever abstractions
- Business-oriented naming
- Small, readable files
- No hidden magic or framework-heavy patterns

### Architecture Patterns

- Layered architecture:
  - Presentation (API routes, WebSocket handlers, UI)
  - Application / Use Cases
  - Domain (entities, rules, policies)
  - Infrastructure (DB, Supabase, external services)

- Controllers and handlers must remain thin
- Business rules must never live in UI or route handlers
- External services are always accessed via interfaces

---

## Testing Strategy

- Focus on unit tests for core domain logic
- Prioritize critical flows:
  - Meeting lifecycle
  - Real-time assistance triggering
  - Post-meeting summaries
- Avoid brittle UI snapshot tests
- Testing protects business rules, not frameworks

---

## Git Workflow

- `main` branch protected
- Feature branches per capability
- Clear, descriptive commits
- No WIP commits on main
- Prefer meaningful commits over noisy history

---

## Domain Context

Core concepts:

Meeting:
- Live sales conversation
- Types: discovery, demo, closing
- Has participants, timestamps, and context

Sales Copilot:
- Real-time assistance engine
- Suggests actions and detects objections
- Never auto-speaks or acts without human decision

Seller:
- Primary user
- Needs fast, discreet, low-friction guidance

Admin / Manager:
- Buyer persona
- Configures playbooks and permissions
- Analyzes performance and adoption

CRM:
- External system of record
- Hunfly only pushes summaries and insights
- Never replaces CRM entities

---

## Important Constraints

- Real-time latency is critical
- No vendor lock-in
- Multi-tenant isolation
- Encryption in transit and at rest
- Minimal data retention
- No training on customer data by default
- Consent-aware meeting analysis

---

## External Dependencies

- Supabase (Auth, Database)
- LLM providers (abstracted)
- Google Calendar
- Google Meet / Zoom (indirect integration)
- CRM platforms (future)
- Billing provider (future)

---

## Architectural Positioning

Hunfly is not:
- A CRM
- A call recorder
- A generic AI note-taker

Hunfly is:
- A real-time decision support system for sales conversations

Any feature or architectural decision that dilutes this focus should be rejected.
