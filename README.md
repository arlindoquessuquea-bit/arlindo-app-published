# KwanzaControl Pro (Arlindo App)

Gestor financeiro mobile-first em pt-AO (Kwanza / AOA). Stack: React 19 + TypeScript + Vite, autenticacao por Supabase, Tailwind via CDN.

## Correr localmente

Requer Node 18+ e npm.

```bash
npm install
npm run dev
```

Abrir http://localhost:5173.

## Build de producao

```bash
npm run build
npm run preview
```

Output em `dist/`.

## Credenciais Supabase

Por defeito o app usa um projeto Supabase publico ja embutido em `src/supabaseClient.ts`. Para apontar para o seu proprio projeto, copie `.env.example` para `.env` e defina:

```
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-anon-key>
```

## Deploy

O repo nao tem deploy publico configurado. Sugestao rapida: importar este repo em Vercel ou Netlify (1-click "Import from Git"), opcionalmente definir as duas variaveis acima, e fazer deploy.
