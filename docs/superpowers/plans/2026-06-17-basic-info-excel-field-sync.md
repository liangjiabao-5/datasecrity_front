# Basic Info Excel Field Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align project basic information Excel import/export metadata and backend handoff documentation with the current page fields.

**Architecture:** Keep backend-owned Excel file generation/parsing unchanged at the API boundary, and update frontend-side import normalization tests plus mock template metadata to describe the new fields. Documentation is updated so backend implementers do not keep old removed columns in templates.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Axios, Vite, script-based Node tests.

---

## Tasks

- [ ] Add a failing script test that checks basic-info Excel metadata and backend documentation contain the current fields and exclude removed fields.
- [ ] Update `src/api/basicInfoApi.ts` mock template metadata to list current sheet columns.
- [ ] Update `doc/项目基本信息与评估团队Excel导入导出功能修改说明.md` and the existing Superpowers design doc to the current basic-info fields.
- [ ] Run focused tests, typecheck, and build.
