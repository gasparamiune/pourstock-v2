# Reform Pre-Flight Checklist

**Purpose**: Before moving any plan from `future/` to `ongoing/`, this checklist MUST be executed to ensure the plan is still valid given any changes that may have occurred since it was written.

---

## Mandatory Checks

### 1. Schema Check
- [ ] Review current database schema (`types.ts`, recent migrations)
- [ ] Compare against tables/columns the plan assumes exist or will create
- [ ] Note any new tables, removed columns, or changed types since plan was written

### 2. Dependency Check
- [ ] Review current `package.json` dependencies and versions
- [ ] Check if any packages the plan relies on have been added, removed, or upgraded
- [ ] Verify no breaking changes in dependencies the plan touches

### 3. Code Conflict Check
- [ ] Read each file the plan intends to modify
- [ ] Confirm the code structure still matches what the plan assumes
- [ ] Note any refactors, renames, or architectural changes since plan creation

### 4. RLS & Auth Check
- [ ] Review current RLS policies on tables the plan touches
- [ ] Confirm auth flows haven't changed (login, signup, role checks)
- [ ] Verify role system compatibility with plan requirements

### 5. Plan Relevance Check
- [ ] Confirm the feature/reform is still needed
- [ ] Check if any part of the plan has been partially implemented by other work
- [ ] Verify no conflicting features have been added

---

## Output

After completing checks, append a **Pre-Flight Status Note** to the plan document before moving it to `ongoing/`:

```markdown
---

## Pre-Flight Status — [DATE]

**Checked by**: [AI / human]

| Check | Status | Notes |
|-------|--------|-------|
| Schema | ✅/⚠️/❌ | ... |
| Dependencies | ✅/⚠️/❌ | ... |
| Code conflicts | ✅/⚠️/❌ | ... |
| RLS & Auth | ✅/⚠️/❌ | ... |
| Plan relevance | ✅/⚠️/❌ | ... |

**Verdict**: Ready to proceed / Needs plan revision / Blocked
```

If any check returns ❌, the plan must be revised before activation.
If any check returns ⚠️, document the concern and decide whether to proceed or revise.

---

*This protocol ensures that no reform starts with stale assumptions.*
