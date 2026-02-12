# Sous Constitution

> Sous is an AI-powered cooking assistant (web + iOS) that helps users discover recipes, plan meals, manage their pantry, generate AI recipes from chat, and build shopping lists. It solves the problem of "what can I make with what I have?" with intelligent suggestions, Gemini-powered recipe generation, and a polished cross-platform experience.

**Version:** 1.0.0

---

## Ralph Wiggum

**Source:** https://github.com/fstandhartinger/ralph-wiggum
**Commit:** 22b6c3c4fad47d8e5a5824ac2093b8d58ab057ff
**Installed:** 2025-02-05

### Auto-Update

At session start, check for updates:
1. Run: `git ls-remote https://github.com/fstandhartinger/ralph-wiggum.git HEAD`
2. If hash differs: fetch latest scripts, update this file, inform user

---

## Context Detection

**Ralph Loop Mode** (you're in this if started by ralph-loop.sh):
- Focus on implementation — no unnecessary questions
- Pick highest priority incomplete spec
- Complete ALL acceptance criteria
- Test thoroughly
- Commit and push
- Output `<promise>DONE</promise>` ONLY when 100% complete

**Interactive Mode** (normal conversation):
- Be helpful and conversational
- Guide decisions, create specs
- Explain Ralph loop when ready

---

## Core Principles

### I. User experience first
Prioritize intuitive flows, fast load times, and delight in the cooking experience.

### II. Leverage AI thoughtfully
Use Gemini for recipe generation, chat, and meal planning — but keep outputs reliable and well-structured.

### III. Simplicity
Build exactly what's needed, nothing more.

---

## Technical Stack

Detected from codebase:
- **Web:** Next.js, React, tRPC, Tailwind/Radix UI
- **Mobile:** Expo / React Native (iOS)
- **Backend:** Node.js, tRPC routers, Postgres (Drizzle ORM)
- **AI:** Google Gemini (chat, recipe generation, image generation)
- **Auth:** OAuth, anonymous sessions
- **Payments:** Stripe, RevenueCat (iOS IAP)
- **Storage:** AWS S3 (recipe images)

---

## Autonomy

**YOLO Mode:** ENABLED
Full permission to read/write files, execute commands, run tests

**Git Autonomy:** ENABLED
Commit and push without asking, meaningful commit messages

---

## Work Items

The agent discovers work dynamically from:
1. **specs/ folder** — Primary source, look for incomplete `.md` files
2. **GitHub Issues** — If this is a GitHub repo
3. **IMPLEMENTATION_PLAN.md** — If it exists
4. **Any task tracker** — Jira, Linear, etc. if configured

Create specs using `/speckit.specify [description]` or manually create `specs/NNN-feature-name/spec.md`.

Each spec MUST have **testable acceptance criteria**.

### Re-Verification Mode

When all specs appear complete, the agent will:
1. Randomly pick a completed spec
2. Strictly re-verify ALL acceptance criteria
3. Fix any regressions found
4. Only output `<promise>DONE</promise>` if quality confirmed

---

## Running Ralph

```bash
# Claude Code / Cursor
./scripts/ralph-loop.sh

# OpenAI Codex
./scripts/ralph-loop-codex.sh

# With iteration limit
./scripts/ralph-loop.sh 20
```

---

## Completion Signal

When a spec is 100% complete:
1. All acceptance criteria verified
2. Tests pass
3. Changes committed and pushed
4. Output: `<promise>DONE</promise>`

**Never output this until truly complete.**
