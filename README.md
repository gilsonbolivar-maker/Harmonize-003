# Harmonize-003

Agenda da clínica da Jimena Andrade. PWA em React/Vite, publicado no GitHub Pages.

## Assistente de IA (desligado)

O assistente não funciona na página estática do GitHub Pages, então ele fica escondido. O código continua no repositório.

A flag está em `src/lib/config.ts`:

```ts
export const IA_ATIVA = false;
```

Com `false`, somem da interface (computador e celular, para a Jimena e para a secretária):

- o item **Assistente** (Pós-cuidado) do menu
- a tela de orientações e protocolo (`src/components/AiAssistantModule.tsx`)
- o cartão **Auditar com IA** na anamnese do paciente

### Como religar

1. Em `src/lib/config.ts`, mude para `export const IA_ATIVA = true`.
2. Publique de novo. O workflow `.github/workflows/pages.yml` roda `npm run build:pages` no push da `main`.

Não precisa descomentar nada. O menu volta em `src/App.tsx` e a auditoria em `src/components/PatientsModule.tsx`. As rotas em `server.ts` (`/api/ai/post-care`, `/api/ai/protocol-suggestion`, `/api/ai/anamnesis-risk`) ficaram como estavam: no GitHub Pages elas não rodam, então a IA só responde com esse servidor no ar.

O service worker (vite-plugin-pwa, `registerType: 'autoUpdate'`) não tem um número de versão manual. O cache usa o hash de cada arquivo. Uma publicação nova troca o hash e o app instalado atualiza sozinho.
