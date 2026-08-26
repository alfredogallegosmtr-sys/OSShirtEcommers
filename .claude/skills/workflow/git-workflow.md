# Git Workflow - Version Control Best Practices

**Scope:** workflow
**Trigger:** cuando se trabaje con Git, control de versiones, commits, branches, o flujos de trabajo en equipo
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para usar Git de manera profesional. Cubre desde comandos básicos hasta workflows avanzados, conventional commits, Git Flow, trunk-based development, resolución de conflictos y mejores prácticas para equipos.

## Cuándo Usar Esta Skill

- Configurar Git en proyectos nuevos
- Trabajar en equipos con branches
- Escribir commits profesionales
- Resolver conflictos
- Hacer code reviews con Pull Requests
- Mantener historial limpio
- Colaborar en open source

## Configuración Inicial

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
git config --global core.editor "code --wait"

git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

## Comandos Básicos

```bash
git init
git clone https://github.com/user/repo.git
git status

git add file.txt
git add .

git commit -m "mensaje"
git commit -am "mensaje"

git log --oneline
git log --graph --all
git log -p

git diff             # working dir vs staged
git diff --staged    # staged vs último commit
git diff HEAD        # working dir vs último commit

git restore file.txt          # descartar cambios
git restore --staged file.txt # unstage
git reset HEAD~1              # deshacer último commit (mantener cambios)
git reset --hard HEAD~1       # deshacer último commit (descartar cambios)
```

## Branches

```bash
git branch feature/nueva-feature
git switch feature/nueva-feature
git switch -c feature/nueva-feature   # crear y cambiar

git branch        # locales
git branch -r     # remotos
git branch -a     # todos

git branch -d feature/completed   # safe delete
git branch -D feature/old         # force delete
git branch -m old-name new-name   # renombrar
```

### Merge

```bash
git checkout main
git merge feature/nueva-feature
git merge --no-ff feature/nueva-feature  # crea merge commit
git merge --abort
```

### Rebase

```bash
git checkout feature/nueva-feature
git rebase main
git rebase -i HEAD~3       # interactivo
git rebase --continue
git rebase --abort
# Merge: mantiene historial, crea merge commits
# Rebase: historial lineal, sin merge commits
```

## Conventional Commits

Formato: `<type>(<scope>): <subject>` + body + footer.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

```bash
git commit -m "feat(auth): add JWT authentication"
git commit -m "fix(api): handle null response from users endpoint"
git commit -m "feat(api)!: change response format

BREAKING CHANGE: API now returns data in {data, meta} format"
git commit -m "refactor(database): optimize query performance

- Add index on user_id column
- Remove unnecessary joins"
```

## Git Flow

Branches: `main` (producción), `develop` (integración), `feature/*`, `release/*`, `hotfix/*`.

```bash
# Feature
git checkout develop && git checkout -b feature/user-profile
git commit -m "feat(profile): add user profile page"
git checkout develop && git merge --no-ff feature/user-profile && git branch -d feature/user-profile

# Release
git checkout -b release/1.2.0 develop
git commit -m "chore(release): bump version to 1.2.0"
git checkout main && git merge --no-ff release/1.2.0 && git tag -a v1.2.0 -m "Release 1.2.0"
git checkout develop && git merge --no-ff release/1.2.0

# Hotfix
git checkout -b hotfix/critical-bug main
git commit -m "fix(auth): resolve login timeout issue"
git checkout main && git merge --no-ff hotfix/critical-bug && git tag -a v1.2.1 -m "Hotfix 1.2.1"
git checkout develop && git merge --no-ff hotfix/critical-bug
```

## Trunk-Based Development

Una branch principal (`main`), feature branches cortos (<1 día), integración continua, feature flags.

```bash
git checkout main && git pull origin main
git checkout -b feature/quick-fix
git commit -m "feat(ui): add loading spinner"
# sync frecuente
git checkout main && git pull origin main
git checkout feature/quick-fix && git rebase main
git push origin feature/quick-fix   # PR rápido, merge, delete branch
```

## Pull Requests

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
```

**Reviewer:** review rápido (<24h), comenta lo bueno, pregunta en vez de exigir, sugiere con ejemplos,
no nitpick de estilo si hay linter.
**Author:** PRs pequeños (<400 líneas), título/descripción descriptivos, responder a todos los comentarios,
no mergear sin aprobación.

## Conflictos

```bash
git merge feature/branch
# CONFLICT en file.txt
git status
# Editar archivo: <<<<<<< HEAD ... ======= ... >>>>>>> feature/branch
git add file.txt
git commit

# Durante rebase
git rebase main
git add file.txt
git rebase --continue   # o --skip / --abort
```

## Tags

```bash
git tag v1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"
git tag -l "v1.*"
git push origin v1.0.0
git push origin --tags
git tag -d v1.0.0
git push origin --delete v1.0.0
```

## Comandos Avanzados

```bash
# Stash
git stash
git stash save "work in progress"
git stash list
git stash apply        # mantiene
git stash pop          # elimina
git stash drop stash@{0}
git stash clear

# Cherry-pick
git cherry-pick abc123
git cherry-pick -n abc123  # sin commit automático

# Reflog (recuperar commit perdido)
git reflog
git checkout abc123
git checkout -b recovered-branch

# Blame
git blame file.txt
git blame -L 10,20 file.txt
```

## .gitignore

```bash
# Node
node_modules/
npm-debug.log
.env

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
*.log
```

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| fatal: not a git repository | No hay repo git | git init |
| Please commit or stash | Cambios sin commit | git stash o git commit |
| refusing to merge unrelated histories | Historias diferentes | git pull --allow-unrelated-histories |
| CONFLICT | Cambios conflictivos | Resolver manualmente |

## Checklist Diario

- [ ] Pull antes de empezar a trabajar
- [ ] Crear branch para nueva feature
- [ ] Commits atómicos y frecuentes
- [ ] Mensajes de commit descriptivos
- [ ] Push al menos una vez al día
- [ ] Sync con main regularmente
- [ ] Code review antes de merge
- [ ] Delete branches después de merge

## Best Practices

1. Commit often (commits pequeños y frecuentes)
2. Descriptive messages (conventional commits)
3. Branch strategy (Git Flow o Trunk-Based)
4. Pull before push
5. Review code (PR reviews obligatorios)
6. Protect main (branch protection rules)
7. Tag releases
8. Clean history (rebase antes de merge)
9. .gitignore
10. Backup (push a remote frecuentemente)
