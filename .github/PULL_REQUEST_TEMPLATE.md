## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Code quality / refactor
- [ ] Documentation
- [ ] Chore / dependency update

## Description

<!-- What changed and why. Link the related issue if one exists. -->

Closes #

## Testing

<!-- How did you verify this works? List manual steps and confirm CI. -->

- [ ] `bun run check` passes locally (lint + format)
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes
- [ ] Tested manually in the browser (solo and/or race)

**Steps to test:**

1.
2.

## Checklist

- [ ] Colors use semantic design tokens, not hard-coded hex
- [ ] Shared game constants live in `packages/shared`, not duplicated per app
- [ ] Score/race changes keep server-side validation authoritative (no client-trusted multipliers)
- [ ] D1 schema changes include a generated Drizzle migration

## UI changes

- [ ] Screenshots or recording attached below
