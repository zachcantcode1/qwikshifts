# Migration Checklist: Detaching `apps/www`

This checklist guides the process of moving the SaaS landing page (`apps/www`) from the `qwikshifts` monorepo to its own dedicated repository.

## Phase 1: Export `apps/www` (User Action Required)

Since `apps/www` is being moved to a new repository, you need to copy the files to a new location outside this project.

1.  [ ] **Create a new directory** for the landing page project (e.g., `../qwikshifts-landing`).
2.  [ ] **Copy files**: Copy the entire contents of `apps/www/` into that new directory.
    *   *Tip:* You can use `cp -r apps/www/ ../qwikshifts-landing/` in your terminal.
3.  [ ] **Initialize Git** in the new directory:
    *   Run `git init` inside the new directory.
    *   Run `git add .` and `git commit -m "Initial commit: Migrated from monorepo"`.
4.  [ ] **Test the new repo**:
    *   Run `bun install` in the new directory.
    *   Run `bun run dev` and ensure the site loads at `http://localhost:3000`.

## Phase 2: Cleanup Monorepo (Completed)

Once you have safely copied the code to the new repository, we need to clean up the current monorepo.

1.  [x] **Remove Directory**: Delete the `apps/www` directory.
2.  [x] **Update Dependencies**: Run `bun install` (or `bun pm trust`) to update `bun.lock` and remove the workspace reference.
3.  [x] **Verify**: Ensure the remaining apps (`api` and `web`) still build and run correctly.
    *   Run `bun run setup` or `bun run dev`.

## Phase 3: Infrastructure (User Action)

1.  [ ] **Update Vercel/Netlify**: If `www` is deployed, point the deployment to the new repository.
2.  [ ] **CI/CD**: If there are GitHub Actions in `.github/workflows` that specifically target `www`, move them to the new repo and remove them from here.
