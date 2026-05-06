# Dashboard de Acompanhamento Crônico

Sistema web para importar relatórios de diabetes e hipertensão, processar os dados no servidor e apresentar uma dashboard quantitativa com filtros e gráficos agregados, sem exposição de dados individuais de pacientes.

## Estado atual

O projeto já possui:

- upload funcional de arquivos `.csv`, `.xls` e `.xlsx`
- parsing server-side com detecção de diabetes/hipertensão
- suporte ao layout alternativo dos datasets crônicos com colunas `meses desde ...`
- persistência em PostgreSQL via Prisma
- persistência apenas de buckets agregados anonimizados
- datasets fictícios robustos para demo
- dashboard quantitativa com:
  - cards contextuais por tipo de importação
  - filtros multiseleção por sexo, raça/cor, faixa etária, bairro, Bolsa Família e lacunas do cuidado
  - gráfico de sexo em pizza com tooltip
  - gráfico de raça/cor em rosca
  - ranking de bairros em barras verticais
  - gráficos por faixa etária e cobertura assistencial
  - adaptação automática quando o upload for apenas de diabetes ou apenas de hipertensão

Resumo mais completo em [docs/progresso_dashboard_cronico.md](/home/fabricio/Documentos/Projetos/dash-doen-as-cronicas/docs/progresso_dashboard_cronico.md).

## Como rodar

1. Configure o ambiente:

```bash
cp .env.example .env
```

2. Suba o banco:

```bash
npm run db:up
```

3. Aplique o schema:

```bash
npm run db:push
```

4. Rode a aplicação:

```bash
npm run dev
```

5. Acesse:

```text
http://localhost:3000
```

## Arquivos de demo

Os datasets fictícios para teste ficam em [datasets](/home/fabricio/Documentos/Projetos/dash-doen-as-cronicas/datasets).

Observações:

- o sistema ainda assume uma condição principal por arquivo
- a dashboard se adapta ao recorte importado
- se o arquivo for só de diabetes, a UI deixa de comparar com hipertensão
- se o arquivo for só de hipertensão, indicadores específicos de diabetes deixam de aparecer

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
