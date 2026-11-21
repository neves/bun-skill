<img src="assets/icon.svg" width="64" height="64" alt="">

# bun-skill

Skill para agentes (Claude Code etc.) que prefere as APIs nativas do Bun às do Node: `Bun.$`, `Bun.spawn`, `bun:sqlite`, `Bun.serve`, `Bun.sql`, `bun fmt`/`lint`/`check`/`test`. Cada API é aprendida no servidor MCP oficial das docs do Bun (`https://bun.com/docs/mcp`), que indexa docs, guias e release notes.

Baseline: **Bun 1.4.5**.

## Instalar

```sh
ln -s "$PWD/skills/bun" ~/.claude/skills/bun
# opcional: conecta as tools search_bun/read_bun_page (sem isso a skill usa curl)
claude mcp add --transport http bun https://bun.com/docs/mcp
```

## Manter atualizada

A cada release do Bun (https://bun.com/blog):

1. Leia as release notes (`https://bun.com/blog/bun-v<versão>`).
2. Se surgiu API nativa que substitui algo do Node ou um pacote npm, adicione uma linha no mapa de `skills/bun/SKILL.md` e o snippet em `skills/bun/ref/<nome>.md`.
3. Atualize o baseline na skill e aqui.

## Evals

Teste agêntico: cada caso abre uma sessão headless do Claude Code (Haiku 5.5) num projeto Bun temporário, com só esta skill instalada, e pede uma tarefa que um agente faria "do jeito Node" (formatar, testar, SQLite, servidor HTTP, shell…). O teste confere os comandos rodados e o código gerado, e falha se o agente buscou algo na web.

```sh
bun run eval                       # todos os casos (skill forçada com /bun)
bun test evals -t sqlite           # um caso
EVAL_TRIGGER=auto bun run eval     # sem /bun: mede se a description dispara sozinha
EVAL_MODEL=claude-sonnet-5-5 bun run eval
```

Os casos ficam em `evals/cases.ts`, e os transcripts em `evals/.runs/`. O caso `lint` é pulado quando o Bun instalado não tem `bun lint`.
