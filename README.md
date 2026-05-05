# Dashboard de Acompanhamento Crônico

Sistema web para importar relatórios de diabetes e hipertensão, persistir os dados em PostgreSQL e apresentar um dashboard com filtros, gráficos e tabela de pacientes.

## Estado atual

O projeto já possui:

- upload funcional de arquivos `.csv`, `.xls` e `.xlsx`
- parsing server-side com detecção de diabetes/hipertensão
- persistência em PostgreSQL via Prisma
- datasets fictícios robustos para demo
- dashboard inicial com:
  - cards de resumo
  - filtros reais
  - gráficos de apresentação
  - tabela paginada

Resumo mais completo em [docs/progresso_dashboard_cronico.md](/home/fabricio/Documentos/uespi/prototipo-pet/docs/progresso_dashboard_cronico.md).

## Como rodar

1. Suba o banco:

```bash
npm run db:up
```

2. Aplique o schema:

```bash
npm run db:push
```

3. Rode a aplicação:

```bash
npm run dev
```

4. Acesse:

```text
http://localhost:3000
```

## Arquivos de demo

Os datasets fictícios para teste ficam em [datasets](/home/fabricio/Documentos/uespi/prototipo-pet/datasets).

## Scripts úteis

```bash
npm run db:up
npm run db:down
npm run db:logs
npm run db:push
npm run lint
npm run test
npm run build
```
