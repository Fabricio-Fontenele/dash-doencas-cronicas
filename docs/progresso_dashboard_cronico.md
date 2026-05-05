# Progresso do Dashboard Crônico

## Visão geral

Este documento consolida o estado atual do projeto, o que já foi implementado, o que está pronto para demonstração e o que ainda falta para encerrar a primeira versão com segurança.

Especificação-base: [docs/specs_dashboard_cronico.md](/home/fabricio/Documentos/uespi/prototipo-pet/docs/specs_dashboard_cronico.md)

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
  - `Paciente`
- Prisma Client gerado.
- Repositórios concretos de:
  - uploads
  - pacientes

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
  - `HIPERTENSAO`
- Parsing com suporte ao formato atual dos datasets de demo.
- Persistência do upload e dos pacientes no banco.

### Dashboard

- Home transformada em dashboard.
- Leitura do último snapshot importado.
- Cards de resumo:
  - total de pacientes
  - atraso médico
  - atraso de enfermagem
  - atraso de visita domiciliar
  - pressão arterial sem registro recente
  - HbA1c sem registro recente
- Filtros atuais:
  - condição
  - sexo
  - raça/cor
  - bairro
  - Bolsa Família
  - faixa etária
  - busca por nome/ID
  - mínimo de meses sem atendimento médico
  - mínimo de meses sem atendimento de enfermagem
  - mínimo de meses sem visita
  - alerta acionado por card
  - ordenação
- Gráficos atuais:
  - top bairros
  - diabetes vs hipertensão
  - cobertura dos principais pontos de cuidado
- Tabela atual:
  - paginação
  - ordenação por estado do filtro
  - badges de alerta
  - colunas mais ricas para demo

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
5. navegar no dashboard com filtros, cards, gráficos e tabela

Isso já cobre uma demo convincente de:

- ingestão de dados
- persistência
- leitura do último snapshot
- exploração do dashboard

## Limitações atuais

### Parser

- O parser está aderente ao layout de demo atual, não ao export real definitivo do sistema de origem.
- Ainda faltam campos mais completos da especificação funcional.

### Dashboard

- Ainda não existem:
  - gráfico de faixa etária
  - gráfico de distribuição por sexo
  - evolução histórica entre uploads
  - comparação temporal entre snapshots
- A tabela ainda não possui:
  - configuração dinâmica de colunas
  - exportação CSV/XLSX
  - ordenação por clique direto no cabeçalho
  - paginação mais avançada

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
  - gráfico por sexo
  - gráfico por faixa etária
  - evolução histórica entre uploads
- melhorar:
  - ordenação por cabeçalho da tabela
  - exportação da seleção filtrada
  - interação entre gráficos e tabela

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
3. adicionar exportação da tabela
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
