

## Diagnosis

The deployed site at `pourstock.lovable.app` serves broken HTML — missing `<head>`, `<script>`, and all CSS/JS references:

```html
<!DOCTYPE html><html lang="en"><body><div id="root"></div></body></html>
```

This means the **production Vite build is failing silently**, so no JS bundle gets injected into the output HTML. The preview works because it runs in dev mode (no build step).

**Likely cause**: The project has both `bun.lock` and `package-lock.json` committed, which can confuse the deployment build system's package manager resolution, causing dependency installation to fail and the build to produce empty output.

## Plan

### 1. Add `bun.lock` to `.gitignore`
Prevents the conflicting lockfile from being deployed. The build system should use only `package-lock.json`.

### 2. Add `resolve.dedupe` to `vite.config.ts`
Ensures a single React instance in the production bundle (prevents subtle hook failures):

```typescript
resolve: {
  alias: { "@": path.resolve(__dirname, "./src") },
  dedupe: ["react", "react-dom", "react/jsx-runtime"],
},
```

### 3. Republish
After the changes, click **Publish → Update** to trigger a clean production build.

---

**Technical detail**: These are two small file edits (one line in `.gitignore`, three lines in `vite.config.ts`) plus a publish action. No application logic changes.

