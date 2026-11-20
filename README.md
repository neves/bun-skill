<img src="assets/icon.svg" width="64" height="64" alt="">

# bun-skill

Skill para agentes (Claude Code etc.) que prefere as APIs nativas do Bun às do Node: `Bun.$`, `Bun.spawn`, `bun:sqlite`, `Bun.serve`, `Bun.sql`, `bun fmt`/`lint`/`check`/`test`. Cada API é aprendida em https://bun.sh/llms.txt.

Baseline: **Bun 1.4.5**.

## Instalar

```sh
ln -s "$PWD/skills/bun" ~/.claude/skills/bun
```

## Manter atualizada

A cada release do Bun (https://bun.com/blog):

1. Leia as release notes (`https://bun.com/blog/bun-v<versão>`).
2. Se surgiu API nativa que substitui algo do Node ou um pacote npm, adicione uma linha na tabela de `skills/bun/SKILL.md`.
3. Atualize o baseline na skill e aqui.
