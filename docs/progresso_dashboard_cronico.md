# Progresso do Dashboard Crônico

## Visão geral

Este documento consolida o estado atual do projeto, o que já foi implementado, o que está pronto para demonstração e o que ainda falta para encerrar a primeira versão com segurança.

Especificação-base: [docs/specs_dashboard_cronico.md](/home/fabricio/Documentos/Projetos/dash-doen-as-cronicas/docs/specs_dashboard_cronico.md)

## Estado atual resumido

O projeto saiu do modelo de dashboard por paciente e hoje opera como dashboard quantitativa agregada:

- o upload continua aceitando CSV/XLS/XLSX
- o parser transforma as linhas em registros anonimizados de cuidado
- o sistema persiste apenas buckets agregados por upload
- a home não exibe nome, ID nem tabela individual
- a interface atual já está adaptada ao tipo de snapshot importado

Exemplos:

- upload só de diabetes: a narrativa e os cards passam a priorizar diabetes e HbA1c
- upload só de hipertensão: a narrativa remove comparação com diabetes e foca em PA e acompanhamento
- upload misto: a dashboard mostra comparação entre condições

## Linha do tempo de implementação

1. `6c879dc` `chore: bootstrap project foundation`
   Base Next.js, TypeScript, Tailwind, Vitest e primeira camada de domínio.
2. `14e438f` `feat: add upload processing use case`
   Caso de uso de processamento de upload e contratos iniciais.
3. `c2c2f80` `feat: add prisma persistence layer`
   Schema Prisma, client e repositórios de persistência.
4. `f20d7d0` `feat: parse chronic report files`
   Parser real de relatórios `.csv`, `.xls` e `.xlsx`.
5. `449907e` `feat: add upload page and server action`
   Página `/importar`, Server Action e histórico de uploads.
6. `1b97274` `feat: add initial dashboard read model`
   Primeira leitura do último snapshot para cards e listagem inicial.
7. `b63cdc6` `feat: add presentation-ready dashboard filters and charts`
   Dashboard narrativo com filtros, gráficos e tabela de demo.
8. `ac4f5f3` `test: add robust demo datasets`
   Datasets fictícios robustos e teste real do parser.
9. `baea6bd` `chore: add local postgres docker setup`
   PostgreSQL local em Docker e scripts de banco.
10. `fc0eb4f` `feat: expand dashboard filters and table details`
    Mais filtros e tabela mais forte para a dashboard.
11. `94d57e6` `docs: add quantitative dashboard refactor design`
    Documento de desenho para a migração de modelo.
12. `c86c4e9` `feat: switch dashboard to aggregate snapshots`
    Remoção da persistência individual e adoção de buckets agregados.
13. `0e6bc48` `fix: support alternate chronic csv headers`
    Parser compatível com o layout alternativo dos datasets crônicos.
14. `be9f25a` `feat: add multi-select dashboard filters`
    Filtros facetados com seleção múltipla e redesign da home.
15. `e6ce31d` `feat: adapt dashboard copy to imported condition`
    Narrativa contextual conforme o tipo de upload.
16. `d4b319c` `feat: contextualize dashboard summary cards`
    Cards superiores adaptados a diabetes, hipertensão ou cenário misto.
17. `0ada06a` `feat: simplify dashboard filter panel`
    Remoção do filtro de condição da UI e visual mais explícito de dropdown.
18. `8903b16` `feat: add donut chart for race color`
    Gráfico de rosca para raça/cor.
19. `554602f` `feat: use skin-tone palette for race chart`
    Paleta contextual no gráfico de raça/cor.
20. `48f8cd0` `fix: restore donut chart for race and full sex labels`
    Ajuste dos gráficos circulares e labels completos para sexo.
21. `27b4ef8` `feat: add hover tooltip to sex pie chart`
    Pizza de sexo com tooltip e legenda abaixo.
22. `349473b` `feat: switch neighborhood chart to vertical bars`
    Bairros em barras verticais.
23. `1e60899` `style: tighten neighborhood bar chart`
    Compactação do gráfico de bairros.
24. `8279da8` `style: simplify neighborhood columns`
    Remoção de fundo e simplificação das colunas de bairros.
25. `7eb01de` `fix: prevent clipping on neighborhood values`
    Correção de corte dos números no topo das colunas.

## O que já está pronto

### Infraestrutura e stack

- Projeto em Next.js App Router com TypeScript.
- Tailwind CSS v4 configurado.
- Vitest configurado para testes unitários.
- PostgreSQL local via Docker Compose.
- Prisma integrado ao projeto.

### Banco e persistência

- Schema com tabelas:
  - `User`
  - `Upload`
  - `AggregateBucket`
- Prisma Client gerado.
- Repositórios concretos de:
  - uploads
  - buckets agregados

### Upload e parsing

- Página `/importar` funcional.
- Server Action para upload.
- Validação de arquivo por extensão e tamanho.
- Suporte a:
  - `.csv`
  - `.xls`
  - `.xlsx`
- Detecção automática de:
  - `DIABETES`
  - `HYPERTENSION`
- Parsing com suporte ao formato atual dos datasets de demo.
- Suporte ao layout com colunas `Meses desde o último...`.
- Fallback para cálculo de meses a partir de data da última medição de PA.
- Persistência apenas do upload e dos buckets agregados no banco.

### Dashboard

- Home transformada em dashboard quantitativa agregada.
- Leitura do último snapshot importado.
- Cards de resumo contextuais:
  - mudam conforme o recorte ser de diabetes, hipertensão ou misto
- Filtros atuais:
  - sexo
  - raça/cor
  - bairro
  - Bolsa Família
  - faixa etária
  - lacunas do cuidado
  - todos com seleção múltipla onde faz sentido
- Gráficos atuais:
  - sexo em pizza com tooltip
  - raça/cor em rosca
  - bairros em barras verticais
  - faixa etária em barras
  - cobertura assistencial
  - comparação entre condições, apenas quando o recorte contém as duas
- A dashboard se adapta ao tipo de importação:
  - se o snapshot for só de diabetes, indicadores específicos de hipertensão comparativa não são enfatizados
  - se o snapshot for só de hipertensão, HbA1c some
  - se houver ambas, a comparação aparece
- Não existe mais:
  - tabela individual
  - busca por nome
  - busca por ID
  - visualização nominal

### Dados fictícios de demo

- Dois datasets robustos com 100 registros cada em [datasets](/home/fabricio/Documentos/uespi/prototipo-pet/datasets).
- Script gerador em [scripts/generate-demo-datasets.mjs](/home/fabricio/Documentos/uespi/prototipo-pet/scripts/generate-demo-datasets.mjs).
- Teste automático validando a leitura desses arquivos.

### Qualidade e validação

- `npm run lint` funcionando.
- `npm run test` funcionando.
- `npm run build` funcionando.
- `npm run db:push` funcionando contra o PostgreSQL local.

## O que está pronto para demonstração

Hoje já é possível demonstrar o fluxo completo:

1. subir o PostgreSQL local
2. aplicar o schema
3. abrir a aplicação
4. importar um dos arquivos fictícios de `datasets/`
5. navegar no dashboard com filtros facetados, cards e gráficos agregados

Isso já cobre uma demo convincente de:

- ingestão de dados
- persistência
- leitura do último snapshot
- exploração quantitativa do dashboard

## Limitações atuais

### Parser

- O parser está aderente ao layout de demo atual, não ao export real definitivo do sistema de origem.
- Ainda faltam campos mais completos da especificação funcional.

### Dashboard

- Ainda não existem:
  - evolução histórica entre uploads
  - comparação temporal entre snapshots
  - exportação consolidada
  - busca interna em filtros longos, como bairro
- Ainda é necessário:
  - consolidar ainda mais a hierarquia visual da dashboard
  - revisar responsividade fina dos gráficos
  - adicionar exportação somente agregada

### Acesso e segurança

- Autenticação ainda não foi implementada.
- Perfis de acesso ainda não foram implementados.
- Usuário padrão de upload ainda é criado automaticamente para permitir a demo.

### Banco e entrega

- Ainda não há migrations versionadas do Prisma.
- O projeto usa `prisma db push` para sincronização.

## O que falta para concluir a primeira versão

### Bloco 1: consolidar a dashboard

- adicionar:
  - evolução histórica entre uploads
- melhorar:
  - exportação apenas de dados consolidados
  - interação entre gráficos e recortes quantitativos
  - busca/UX dos filtros longos
  - responsividade dos gráficos

### Bloco 2: fechar o uso operacional

- adaptar parser aos arquivos reais definitivos
- ampliar cobertura dos campos da spec
- criar seed/import automatizado de demo

### Bloco 3: fechar a plataforma

- autenticação
- perfis de acesso
- proteção de rotas
- configurações
- gestão de usuários

### Bloco 4: endurecimento final

- migrations Prisma
- revisão de erros e mensagens
- testes de integração do fluxo de upload
- documentação operacional final

## Ordem recomendada

Para concluir com o menor risco:

1. consolidar a dashboard
2. adaptar parser ao formato real
3. adicionar exportação agregada
4. implementar autenticação e perfis
5. versionar migrations e fechar testes de integração

## Comandos úteis

```bash
npm run db:up
npm run db:down
npm run db:logs
npm run db:push
npm run lint
npm run test
npm run build
npm run dev
```
