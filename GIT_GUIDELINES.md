# Git Guidelines for Commercial Software Development

## Table of Contents
- [Branch Strategy](#branch-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Standards](#code-review-standards)
- [Release Management](#release-management)
- [Emergency Hotfix Process](#emergency-hotfix-process)

---

## Branch Strategy

### Branch Types

#### Main Branches
- **`main`** (or `master`)
  - Production-ready code only
  - Protected branch with required reviews
  - Direct commits prohibited
  - Tagged for releases (e.g., `v1.0.0`, `v1.1.0`)

- **`develop`**
  - Integration branch for features
  - Next release candidate
  - All features merge here first
  - Should always be stable and deployable

#### Supporting Branches

- **Feature Branches** (`feature/<ticket-id>-<brief-description>`)
  - Branch from: `develop`
  - Merge back into: `develop`
  - Naming: `feature/PROJ-123-user-authentication`
  - Lifespan: Until feature completion
  - Example: `feature/SK-456-biometric-focus-detection`

- **Bugfix Branches** (`bugfix/<ticket-id>-<brief-description>`)
  - Branch from: `develop`
  - Merge back into: `develop`
  - Naming: `bugfix/PROJ-124-timer-state-issue`
  - For non-urgent bug fixes

- **Hotfix Branches** (`hotfix/<version>-<brief-description>`)
  - Branch from: `main`
  - Merge back into: `main` AND `develop`
  - Naming: `hotfix/v1.0.1-security-patch`
  - For critical production issues only

- **Release Branches** (`release/<version>`)
  - Branch from: `develop`
  - Merge back into: `main` AND `develop`
  - Naming: `release/v1.1.0`
  - Only bug fixes, documentation, release prep
  - No new features allowed

### Branch Naming Convention

```
<type>/<ticket-id>-<brief-description>

Types: feature | bugfix | hotfix | release | experiment
Example: feature/SK-123-add-dark-mode
```

### Branch Protection Rules

#### `main` Branch
- Require pull request reviews (minimum 2 approvals)
- Require status checks to pass
- Require branches to be up to date
- Include administrators in restrictions
- No force pushes
- No deletions

#### `develop` Branch
- Require pull request reviews (minimum 1 approval)
- Require status checks to pass
- Allow force push for maintainers only (with caution)

---

## Commit Guidelines

### Commit Message Format

Follow the **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring (no functional changes)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependencies, build config
- **ci**: CI/CD configuration changes
- **revert**: Reverting previous commits

#### Scope (Optional)
- Component/module affected: `auth`, `ui`, `api`, `database`
- Example: `feat(auth): add OAuth2 integration`

#### Subject
- Brief description (50 characters max)
- Imperative mood: "add" not "added" or "adds"
- No period at the end
- Capitalize first letter

#### Body (Optional)
- Detailed explanation of changes
- Wrap at 72 characters
- Explain what and why, not how

#### Footer (Optional)
- Breaking changes: `BREAKING CHANGE: description`
- Issue references: `Closes #123`, `Fixes #456`
- Co-authors: `Co-authored-by: Name <email>`

### Commit Examples

#### Good Commits
```bash
feat(biometric): add eye-tracking focus detection

Implement real-time focus score calculation using eye gaze estimation.
Integrates with MediaPipe Face Mesh for landmark detection.

Closes #SK-123
```

```bash
fix(timer): resolve state inconsistency on pause/resume

The timer state wasn't properly synchronized when rapidly toggling
pause/resume. Added debouncing and state validation.

Fixes #SK-456
```

```bash
refactor(api): extract authentication middleware

Moved auth logic into reusable middleware for better separation
of concerns and improved testability.
```

#### Bad Commits (Avoid)
```bash
# Too vague
git commit -m "fixed bug"

# Not imperative mood
git commit -m "Fixed the timer bug"

# Too detailed in subject
git commit -m "feat: added a new feature that allows users to track their biometric data in real-time using camera"

# Multiple unrelated changes
git commit -m "feat: add dark mode, fix timer bug, update dependencies"
```

### Commit Best Practices

1. **Atomic Commits**: One logical change per commit
2. **Frequent Commits**: Commit early and often
3. **Complete Commits**: Don't commit half-done work
4. **Test Before Commit**: Ensure code compiles and tests pass
5. **No Generated Files**: Don't commit build artifacts or dependencies
6. **Meaningful Messages**: Write commit messages for future developers

### When to Commit

✅ **DO Commit When:**
- Feature increment is complete
- Bug fix is verified
- Tests are passing
- Code is reviewed (self-review)
- Breaking point reached (safe state)

❌ **DON'T Commit When:**
- Code doesn't compile
- Tests are failing
- Work is half-done (use git stash instead)
- Debugging code is still present
- Temporary files are included

---

## Pull Request Process

### Before Creating PR

1. **Update from base branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/SK-123-new-feature
   git merge develop
   # Or use rebase for cleaner history
   git rebase develop
   ```

2. **Run full test suite**
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

3. **Self-review changes**
   ```bash
   git diff develop...HEAD
   ```

4. **Squash WIP commits** (if needed)
   ```bash
   git rebase -i HEAD~5
   ```

### PR Title Format

```
<type>(<scope>): <brief description>

Example: feat(auth): implement OAuth2 authentication
```

### PR Description Template

```markdown
## Description
Brief summary of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement

## Related Issues
Closes #123
Related to #456

## Changes Made
- Detailed list of changes
- What was added/modified/removed
- Technical decisions made

## Testing
### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

### Test Results
- All tests passing: ✅
- Coverage: 85% (+5%)
- Screenshots/recordings (if UI changes):

## Performance Impact
- Load time: No change / Improved by X% / Regressed by Y%
- Bundle size: +/-X KB
- Memory usage: No significant change

## Breaking Changes
None / List breaking changes and migration guide

## Deployment Notes
- Database migrations required: Yes/No
- Environment variables added: List
- Dependencies added/updated: List

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] Tests added and passing
- [ ] No merge conflicts
```

### PR Size Guidelines

- **Small**: < 200 lines (ideal)
- **Medium**: 200-500 lines (acceptable)
- **Large**: 500-1000 lines (needs justification)
- **Extra Large**: > 1000 lines (split into smaller PRs)

### PR Submission Rules

1. **One feature per PR** - Keep PRs focused
2. **Pass all CI checks** - No red builds
3. **No merge conflicts** - Resolve before requesting review
4. **Complete documentation** - Update relevant docs
5. **Link to issues** - Use issue tracker references
6. **Add reviewers** - Assign appropriate team members
7. **Label appropriately** - Use project labels (bug, feature, etc.)

---

## Code Review Standards

### Reviewer Responsibilities

#### Review Within
- **High Priority**: 4 hours
- **Normal Priority**: 24 hours
- **Low Priority**: 48 hours

#### Review Checklist

**Functionality**
- [ ] Code does what PR claims
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] No obvious bugs

**Code Quality**
- [ ] Follows project conventions
- [ ] DRY principle applied
- [ ] Functions are focused and small
- [ ] Variable names are descriptive
- [ ] No dead code

**Testing**
- [ ] Tests cover new functionality
- [ ] Tests are meaningful
- [ ] Edge cases tested
- [ ] Integration tests if needed

**Security**
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Authentication/authorization correct

**Performance**
- [ ] No obvious performance issues
- [ ] Efficient algorithms used
- [ ] No memory leaks
- [ ] Database queries optimized

**Documentation**
- [ ] Complex logic commented
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] CHANGELOG updated

### Review Comments

Use conventional comment prefixes:

- **`MUST:`** - Must be fixed before merge
- **`SHOULD:`** - Strongly recommended
- **`CONSIDER:`** - Suggestion for improvement
- **`QUESTION:`** - Need clarification
- **`PRAISE:`** - Positive feedback
- **`NIT:`** - Minor style issue (non-blocking)

### Example Comments

```markdown
MUST: Add input validation for email field
This could lead to security issues if malicious input is provided.

SHOULD: Extract this logic into a separate utility function
This code is duplicated in 3 places. DRY principle would improve maintainability.

CONSIDER: Using useMemo here for performance
This calculation runs on every render and could benefit from memoization.

QUESTION: Why are we using setTimeout instead of requestAnimationFrame?
Could you explain the reasoning behind this approach?

PRAISE: Great error handling! Very comprehensive.

NIT: Missing space after comma on line 45
```

### Approval Criteria

#### Approve ✅
- All MUST issues resolved
- Code meets quality standards
- Tests passing
- Documentation complete

#### Request Changes 🔄
- MUST issues present
- Tests failing
- Breaking changes without migration
- Security concerns

#### Comment 💬
- Minor suggestions only
- Questions for clarification
- No blocking issues

---

## Release Management

### Semantic Versioning

Follow **SemVer** (MAJOR.MINOR.PATCH):

```
v1.2.3
│ │ └─ PATCH: Bug fixes, patches
│ └─── MINOR: New features, backward compatible
└───── MAJOR: Breaking changes
```

### Release Process

#### 1. Create Release Branch
```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0
```

#### 2. Update Version Numbers
```bash
# package.json, version files, etc.
npm version minor  # or major/patch
```

#### 3. Update Changelog
```markdown
# CHANGELOG.md

## [1.2.0] - 2025-11-20

### Added
- New biometric focus detection feature
- Dark mode support

### Changed
- Improved timer accuracy

### Fixed
- Session state inconsistency bug

### Security
- Updated dependencies to patch vulnerabilities
```

#### 4. Final Testing
```bash
npm run test:all
npm run build
npm run e2e
```

#### 5. Merge to Main
```bash
# Create PR: release/v1.2.0 → main
# After approval and merge:
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0
```

#### 6. Merge Back to Develop
```bash
git checkout develop
git merge main
git push origin develop
```

### Release Checklist

- [ ] All features complete and tested
- [ ] Version numbers updated
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Migration guide (if breaking changes)
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks acceptable
- [ ] Release notes prepared
- [ ] Deployment plan reviewed
- [ ] Rollback plan prepared

---

## Emergency Hotfix Process

### When to Use Hotfix

- Critical production bugs
- Security vulnerabilities
- Data loss issues
- Complete service outages

### Hotfix Workflow

#### 1. Create Hotfix Branch
```bash
git checkout main
git pull origin main
git checkout -b hotfix/v1.2.1-security-patch
```

#### 2. Fix the Issue
```bash
# Make minimal changes to fix issue
git add .
git commit -m "fix: patch critical security vulnerability

Addresses CVE-2024-XXXXX by updating dependency
and adding input validation.

SECURITY: Critical"
```

#### 3. Test Thoroughly
```bash
npm run test:all
npm run security:audit
```

#### 4. Bump Patch Version
```bash
npm version patch
```

#### 5. Merge to Main
```bash
# Create PR: hotfix/v1.2.1-security-patch → main
# Expedited review required
# After merge:
git checkout main
git tag -a v1.2.1 -m "Hotfix: Security patch"
git push origin v1.2.1
```

#### 6. Merge to Develop
```bash
git checkout develop
git merge main
git push origin develop
```

#### 7. Deploy Immediately
```bash
# Follow emergency deployment procedure
```

### Hotfix Checklist

- [ ] Issue severity confirmed (P0/P1)
- [ ] Root cause identified
- [ ] Fix tested in isolation
- [ ] Minimal changes only
- [ ] No new features added
- [ ] Backward compatible
- [ ] Rollback plan ready
- [ ] Stakeholders notified
- [ ] Post-mortem scheduled

---

## Git Commands Reference

### Daily Workflow

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/PROJ-123-new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/PROJ-123-new-feature

# Update from develop
git checkout develop
git pull origin develop
git checkout feature/PROJ-123-new-feature
git merge develop

# Create PR (via GitHub/GitLab UI)
```

### Useful Commands

```bash
# View status
git status
git log --oneline --graph --all

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit message
git commit --amend -m "new message"

# Stash changes
git stash
git stash pop

# Cherry-pick commit
git cherry-pick <commit-hash>

# Rebase interactive
git rebase -i HEAD~5

# Clean untracked files
git clean -fd
```

---

## Best Practices Summary

### DO ✅
- Write clear, descriptive commit messages
- Create small, focused PRs
- Test before committing
- Review your own code first
- Update documentation
- Use feature branches
- Keep branches short-lived
- Rebase regularly from develop
- Tag releases
- Use meaningful branch names

### DON'T ❌
- Commit directly to main
- Force push to shared branches
- Commit generated files
- Leave debug code
- Create huge PRs
- Mix refactoring with features
- Commit broken code
- Ignore code review feedback
- Use ambiguous commit messages
- Work on multiple features in one branch

---

## Additional Resources

### Tools
- **Git GUI**: GitKraken, SourceTree, GitHub Desktop
- **CLI Enhancements**: git-extras, tig, lazygit
- **Commit Helpers**: commitizen, husky
- **Merge Tools**: Beyond Compare, KDiff3, P4Merge

### Learning Resources
- [Pro Git Book](https://git-scm.com/book/en/v2)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-20 | Initial guidelines document |
