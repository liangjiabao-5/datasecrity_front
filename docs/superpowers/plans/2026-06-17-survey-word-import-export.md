# Survey Word Import Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend-driven Word template download, Word import, and Word export to the information survey page.

**Architecture:** Replace the old current-tab JSON import/export controls with project-level Word file actions. Keep binary download and multipart upload in `surveyApi`, preserve backend validation details through `ApiError.data`, and normalize import errors before showing them in a page dialog. After a successful Word import, reload all five survey tabs from existing survey endpoints.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Axios, Vite, script-based Node tests.

---

## Tasks

- [ ] Add a focused script test for survey Word import error normalization.
- [ ] Add survey Word API methods and mock Blob/import fallbacks in `src/api/surveyApi.ts`.
- [ ] Preserve backend error `data` on `ApiError` in `src/types/api.ts` and `src/utils/request.ts`.
- [ ] Replace survey page JSON actions with Word template download/import/export, `.docx` validation, loading states, full survey reload, and validation error dialog.
- [ ] Run focused script test, `npm run typecheck`, and `npm run build`.
