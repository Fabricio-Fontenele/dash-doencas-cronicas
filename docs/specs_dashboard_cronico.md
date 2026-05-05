# 📊 Dashboard de Acompanhamento — Diabetes & Hipertensão
**Especificação Técnica e Funcional do Projeto**
> Versão 1.2 · Next.js 15 · Clean Architecture · SOLID · PostgreSQL

---

## 1. Visão Geral do Produto

Sistema web que permite equipes de saúde da Atenção Básica carregar relatórios de acompanhamento exportados do prontuário (CSV/XLS) e visualizar dashboards interativos com indicadores de qualidade do cuidado para pacientes diabéticos e hipertensos.

**Objetivo central:** transformar dados brutos em informação acionável — quem está sem atendimento, quem está com exames em atraso, e como está a cobertura geral da equipe.

---

## 2. Personas e Perfis de Uso

### 🩺 Enfermeiro(a) — Operador Principal
| Atributo | Descrição |
|---|---|
| Função principal | Exportar relatórios do prontuário e carregar no dashboard |
| Necessidade | Ver rapidamente quais pacientes estão sem acompanhamento |
| Acesso | Upload de CSV + visualização completa |
| Frequência | Semanal ou quinzenal |

### 👨‍⚕️ Médico(a) — Visualizador Clínico
| Atributo | Descrição |
|---|---|
| Função principal | Consultar indicadores para planejamento de agenda |
| Necessidade | Identificar pacientes prioritários para consulta |
| Acesso | Somente leitura — sem upload |

### 📋 Gestor / Coordenador — Visão Gerencial
| Atributo | Descrição |
|---|---|
| Função principal | Monitorar cobertura e metas da equipe |
| Necessidade | Comparativos por período, bairro e condição |
| Acesso | Leitura + exportação + configurações + gestão de usuários |

### 🚶 Agente Comunitário de Saúde (ACS)
| Atributo | Descrição |
|---|---|
| Função principal | Verificar pacientes da sua microárea sem visita domiciliar |
| Necessidade | Lista filtrada automaticamente pelo seu bairro |
| Acesso | Somente leitura — visão simplificada |

---

## 3. Funcionalidades do Sistema

### 3.1 Upload e Importação de Dados

- Área de upload com drag-and-drop, suporte a `.xls`, `.xlsx` e `.csv`
- Processamento no servidor via Server Action do Next.js 15 + SheetJS
- Detecção automática do tipo de relatório pela linha de título (Hipertensão ou Diabetes)
- Suporte a encoding ISO-8859-1 e UTF-8, separador ponto e vírgula
- Validação de colunas obrigatórias antes de persistir no banco
- Histórico de uploads salvo no PostgreSQL: data, arquivo, tipo, total de registros, usuário
- Dados persistem entre sessões — equipe inteira vê os dados mais recentes

> ⚠️ **LGPD:** Nenhum dado de paciente deve trafegar para serviços externos. Toda a cadeia (Next.js + PostgreSQL) deve rodar em infraestrutura controlada pela unidade ou secretaria.

---

### 3.2 Filtros do Dashboard

#### Filtro Principal
| Filtro | Comportamento |
|---|---|
| Condição | Alterna entre: **Todos \| Diabetes \| Hipertensão** |

#### Filtros Secundários
| Filtro | Tipo | Opções / Comportamento |
|---|---|---|
| Sexo | Seleção múltipla | Masculino · Feminino · Não informado |
| Faixa etária | Range | 0–17 · 18–39 · 40–59 · 60–79 · 80+ |
| Raça/Cor | Seleção múltipla | Valores únicos do banco |
| Bairro / Microárea | Seleção múltipla | Valores únicos do campo Bairro |
| Bolsa Família | Toggle | Sim · Não · Todos |
| Tempo s/ atend. médico | Slider (meses) | 0 a 24+ meses |
| Tempo s/ atend. enfermagem | Slider (meses) | 0 a 24+ meses |
| Tempo s/ visita domiciliar | Slider (meses) | 0 a 24+ meses |
| Hemoglobina glicada* | Toggle | Com resultado · Sem resultado · Todos |
| Avaliação dos pés* | Toggle | Realizada · Não realizada · Todos |
| Período do upload | Seleção | Filtrar por data do arquivo importado |

*\* Disponíveis somente quando condição = Diabetes.*

---

### 3.3 Indicadores do Dashboard

#### Cards de Resumo
| Card | Cálculo |
|---|---|
| Total de pacientes | Contagem após filtros |
| Sem atend. médico > 6 meses | `mesesUltimoAtendMedico > 6` |
| Sem atend. enfermagem > 6 meses | `mesesUltimoAtendEnfermagem > 6` |
| Sem visita domiciliar > 3 meses | `mesesUltimaVisitaDomiciliar > 3` |
| Sem medição de PA recente | Data vazia ou > 6 meses |
| Sem HbA1c recente *(Diabetes)* | Data vazia ou > 12 meses |

#### Gráficos
| Gráfico | Tipo | Descrição |
|---|---|---|
| Distribuição por sexo | Donut | % homens e mulheres |
| Distribuição por faixa etária | Barras verticais | Contagem por faixa |
| Top bairros | Barras horizontais | Top 10 com mais pacientes |
| Tempo s/ atendimento médico | Histograma | Distribuição em meses |
| Diabetes vs Hipertensão | Barras agrupadas | Comparativo quando "Todos" |
| Cobertura de visitas | Gauge | % com visita < 3 meses |
| Evolução histórica | Linha | Comparativo entre uploads ao longo do tempo |

---

### 3.4 Tabela de Pacientes

- Listagem paginada com todos os pacientes após filtros aplicados
- Colunas configuráveis (mostrar/ocultar)
- Ordenação por qualquer coluna
- Busca textual por nome ou ID
- Destaque visual para pacientes com indicadores críticos
- Clicar em card de alerta pré-filtra a tabela
- Exportação da seleção para CSV ou Excel

---

### 3.5 Autenticação e Controle de Acesso

| Perfil | Upload | Dashboard | Tabela | Exportar | Configurações |
|---|---|---|---|---|---|
| Enfermeiro(a) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Médico(a) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Gestor | ❌ | ✅ | ✅ | ✅ | ✅ |
| ACS | ❌ | ✅ simplificado | ✅ só seu bairro | ❌ | ❌ |

- Autenticação via **NextAuth.js v5** com credenciais (e-mail + senha)
- Senhas com hash **bcrypt** no PostgreSQL
- Sessão **JWT** com expiração configurável
- Guards no **middleware** do Next.js — sem acesso a rotas protegidas sem token válido
- Gestor cria e gerencia contas pelo painel de configurações

---

## 4. Arquitetura — Clean Architecture

O projeto é dividido em **quatro camadas independentes**. Cada camada só conhece a camada imediatamente inferior — nunca o contrário.

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                │  Next.js Pages, Server Components,
│      (app/, components/)                   │  Server Actions, API Routes
├─────────────────────────────────────────────┤
│           Application Layer                 │  Use Cases, DTOs,
│      (src/application/)                    │  Application Services
├─────────────────────────────────────────────┤
│             Domain Layer                    │  Entities, Value Objects,
│      (src/domain/)                         │  Repository Interfaces, Domain Services
├─────────────────────────────────────────────┤
│          Infrastructure Layer               │  Prisma, PostgreSQL, SheetJS,
│      (src/infrastructure/)                 │  NextAuth adapters, parsers
└─────────────────────────────────────────────┘
```

> **Regra de ouro:** o Domain nunca importa nada de Infrastructure, Application ou Presentation. A dependência sempre aponta para dentro.

---

### 4.1 Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | React 19, Server Actions estáveis, `cache()` nativo, Turbopack |
| Linguagem | **TypeScript 5** | Tipagem estrita em todas as camadas |
| Banco de dados | **PostgreSQL 16** | Robusto, queries complexas de filtro e agregação |
| ORM | **Prisma 5** | Schema declarativo, migrations, type-safe |
| Autenticação | **NextAuth.js v5** | Integração nativa Next.js 15, JWT, middleware guards |
| Parsing XLS/CSV | **SheetJS (xlsx)** | Server-side via Server Action, suporte a ISO-8859-1 |
| Gráficos | **Recharts** | Composable, integração natural com React, SSR-safe |
| Tabela | **TanStack Table v8** | Paginação, ordenação e filtros client-side performáticos |
| Estilo | **Tailwind CSS v4** | Utilitário, sem overhead |
| Componentes UI | **shadcn/ui** | Radix-based, acessível, sem lock-in |
| Validação | **Zod** | Schema validation em todas as bordas (DTOs, env, forms) |
| Testes | **Vitest + Testing Library** | Unit (domain/use cases) + integration (API routes) |
| Exportação | **SheetJS + FileSaver.js** | Geração de XLSX no navegador |
| Deploy | **Vercel** ou **VPS + Docker** | CI/CD simples ou on-premise |
| Banco (host) | **Neon / Supabase** ou self-hosted | PostgreSQL gerenciado com free tier |

---

### 4.2 Estrutura de Pastas

```
/
├── app/                                        # Next.js App Router (Presentation)
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                            # Dashboard principal
│   │   ├── pacientes/page.tsx
│   │   ├── importar/page.tsx
│   │   └── configuracoes/page.tsx
│   └── api/
│       └── auth/[...nextauth]/route.ts
│
├── src/
│   │
│   ├── domain/                                 # Camada de Domínio — zero dependências externas
│   │   ├── entities/
│   │   │   ├── Paciente.ts                     # Entidade com regras de negócio
│   │   │   ├── Upload.ts
│   │   │   └── User.ts
│   │   ├── value-objects/
│   │   │   ├── Condicao.ts                     # DIABETES | HIPERTENSAO
│   │   │   ├── Perfil.ts                       # ENFERMEIRO | MEDICO | GESTOR | ACS
│   │   │   └── FaixaEtaria.ts
│   │   ├── repositories/                       # Interfaces (contratos)
│   │   │   ├── IPacienteRepository.ts
│   │   │   ├── IUploadRepository.ts
│   │   │   └── IUserRepository.ts
│   │   └── services/
│   │       └── IndicadorService.ts             # Cálculo dos indicadores (regra pura)
│   │
│   ├── application/                            # Camada de Aplicação — orquestra o domínio
│   │   ├── use-cases/
│   │   │   ├── upload/
│   │   │   │   ├── ProcessarUploadUseCase.ts
│   │   │   │   └── ListarUploadsUseCase.ts
│   │   │   ├── pacientes/
│   │   │   │   ├── ListarPacientesUseCase.ts
│   │   │   │   └── ExportarPacientesUseCase.ts
│   │   │   └── indicadores/
│   │   │       └── GerarIndicadoresUseCase.ts
│   │   ├── dtos/
│   │   │   ├── FiltrosPacienteDTO.ts
│   │   │   ├── IndicadoresDTO.ts
│   │   │   └── UploadResultadoDTO.ts
│   │   └── ports/
│   │       └── IFileParser.ts                  # Porta para serviços externos
│   │
│   ├── infrastructure/                         # Camada de Infraestrutura — detalhes técnicos
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   ├── client.ts                   # Singleton PrismaClient
│   │   │   │   └── schema.prisma
│   │   │   └── repositories/
│   │   │       ├── PrismaPacienteRepository.ts
│   │   │       ├── PrismaUploadRepository.ts
│   │   │       └── PrismaUserRepository.ts
│   │   ├── parsers/
│   │   │   ├── SheetJSFileParser.ts            # Implementa IFileParser
│   │   │   ├── HipertensaoParser.ts            # Mapeia colunas → Paciente entity
│   │   │   └── DiabetesParser.ts
│   │   └── auth/
│   │       └── nextauth.config.ts
│   │
│   └── presentation/                           # Adaptadores de apresentação
│       ├── actions/                            # Next.js Server Actions
│       │   ├── upload.actions.ts
│       │   └── auth.actions.ts
│       ├── mappers/                            # Domain → ViewModel
│       │   ├── PacienteMapper.ts
│       │   └── IndicadorMapper.ts
│       └── validators/                         # Zod schemas para inputs externos
│           ├── filtros.schema.ts
│           └── upload.schema.ts
│
├── components/                                 # React components (UI pura)
│   ├── dashboard/
│   │   ├── Cards.tsx
│   │   ├── Graficos.tsx
│   │   └── Filtros.tsx
│   ├── tabela/
│   │   └── TabelaPacientes.tsx
│   ├── upload/
│   │   └── UploadZone.tsx
│   └── ui/                                     # shadcn/ui components
│
└── tests/
    ├── unit/
    │   ├── domain/
    │   │   └── IndicadorService.test.ts
    │   └── application/
    │       └── ProcessarUploadUseCase.test.ts
    └── integration/
        └── upload.action.test.ts
```

---

### 4.3 Princípios SOLID aplicados

#### S — Single Responsibility Principle
Cada classe tem uma única razão para mudar.

```typescript
// ✅ Cada classe faz uma coisa só
class HipertensaoParser { parse(rows: RawRow[]): Paciente[] { ... } }
class DiabetesParser    { parse(rows: RawRow[]): Paciente[] { ... } }
class SheetJSFileParser { read(buffer: Buffer): RawRow[]    { ... } }

// ❌ Mistura parsing, validação e persistência na mesma classe
class UploadService {
  parseAndValidateAndSave(file: File) { ... }
}
```

#### O — Open/Closed Principle
Aberto para extensão, fechado para modificação. Novos tipos de relatório não alteram código existente.

```typescript
// Contrato fechado para modificação
interface IFileParser {
  parse(buffer: Buffer, encoding: string): RawRow[]
}

// Estendemos criando novas implementações, sem tocar na interface
class SheetJSFileParser implements IFileParser { ... }
class PapaParseCSVParser implements IFileParser { ... } // futuro — zero alterações no Use Case
```

#### L — Liskov Substitution Principle
Qualquer implementação de repositório substitui outra sem quebrar os use cases.

```typescript
// Use case depende da interface, não da implementação concreta
class ListarPacientesUseCase {
  constructor(private repo: IPacienteRepository) {}
  // Funciona com PrismaPacienteRepository em produção
  // ou com InMemoryPacienteRepository nos testes — sem alterar nada
}
```

#### I — Interface Segregation Principle
Interfaces pequenas e específicas — nenhuma classe é forçada a implementar o que não usa.

```typescript
// ✅ Interfaces segregadas por responsabilidade
interface IPacienteReader {
  findMany(filtros: FiltrosPacienteDTO): Promise<Paciente[]>
  count(filtros: FiltrosPacienteDTO): Promise<number>
}

interface IPacienteWriter {
  createMany(pacientes: Paciente[], uploadId: string): Promise<void>
}

// ACS só precisa de IPacienteReader — não precisa conhecer createMany
```

#### D — Dependency Inversion Principle
Use cases dependem de abstrações (interfaces), nunca de implementações concretas. Injeção via construtor.

```typescript
// src/application/use-cases/upload/ProcessarUploadUseCase.ts
export class ProcessarUploadUseCase {
  constructor(
    private readonly fileParser: IFileParser,           // porta — não é SheetJS
    private readonly uploadRepo: IUploadRepository,     // contrato — não é Prisma
    private readonly pacienteRepo: IPacienteRepository  // contrato — não é Prisma
  ) {}

  async execute(input: ProcessarUploadInput): Promise<UploadResultadoDTO> {
    const rows = this.fileParser.parse(input.buffer, input.encoding)
    // Lógica de negócio limpa — sem Prisma, sem SheetJS, sem Next.js aqui
  }
}
```

---

### 4.4 Princípios Clean Code aplicados

- **Nomes que revelam intenção:** `calcularPacientesSemAtendimentoMedico()` em vez de `calc()` ou `getPac()`
- **Funções pequenas e coesas:** cada função faz uma coisa; use cases expõem apenas `execute()`
- **Sem números mágicos:** constantes nomeadas no domínio (`LIMITE_MESES_SEM_ATEND_MEDICO = 6`)
- **Sem comentários desnecessários:** o código se autodescreve; comentários só para decisões não-óbvias
- **Early return:** evitar aninhamento profundo de `if/else`
- **DTOs validados com Zod** em todas as bordas de entrada (Server Actions, forms)
- **Erros tipados:** exceções de domínio explícitas (`DomainError`, `ValidationError`) em vez de `throw new Error('algo deu errado')`

```typescript
// src/domain/entities/Paciente.ts — entidade com regras de negócio encapsuladas

const LIMITE_MESES_SEM_ATEND_MEDICO      = 6
const LIMITE_MESES_SEM_VISITA_DOMICILIAR = 3

export class Paciente {
  private constructor(private readonly props: PacienteProps) {}

  static create(props: PacienteProps): Paciente {
    if (props.idade < 0 || props.idade > 150) {
      throw new DomainError('Idade inválida')
    }
    return new Paciente(props)
  }

  get precisaAtendimentoMedico(): boolean {
    return (this.props.mesesUltimoAtendMedico ?? Infinity) > LIMITE_MESES_SEM_ATEND_MEDICO
  }

  get precisaVisitaDomiciliar(): boolean {
    return (this.props.mesesUltimaVisitaDomiciliar ?? Infinity) > LIMITE_MESES_SEM_VISITA_DOMICILIAR
  }
}
```

---

### 4.5 Schema do Banco (Prisma)

```prisma
// src/infrastructure/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  nome      String
  email     String   @unique
  senha     String
  perfil    Perfil
  bairro    String?  // filtro automático para ACS
  ativo     Boolean  @default(true)
  criadoEm DateTime  @default(now())
  uploads   Upload[]
}

enum Perfil {
  ENFERMEIRO
  MEDICO
  GESTOR
  ACS
}

model Upload {
  id          String     @id @default(cuid())
  nomeArquivo String
  tipo        Condicao
  totalLinhas Int
  criadoEm   DateTime   @default(now())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  pacientes   Paciente[]
}

enum Condicao {
  DIABETES
  HIPERTENSAO
}

model Paciente {
  id        String   @id @default(cuid())
  uploadId  String
  upload    Upload   @relation(fields: [uploadId], references: [id], onDelete: Cascade)

  // Campos comuns
  idade                        Int?
  sexo                         String?
  racaCor                      String?
  bolsaFamilia                 Boolean?
  bairro                       String?
  mesesUltimoAtendMedico       Int?
  mesesUltimoAtendEnfermagem   Int?
  mesesUltimoAtendOdonto       Int?
  mesesUltimaVisitaDomiciliar  Int?
  ultimoPeso                   Float?
  ultimaAltura                 Float?
  dataMedicaoPesoAltura        DateTime?
  ultimaMedicaoPressaoArterial String?
  dataMedicaoPressaoArterial   DateTime?
  qtdVisitasDomiciliares       Int?
  dataUltimaConsulta           DateTime?

  // Exclusivos Hipertensão
  qtdMedicoesPressaoArterial   Int?
  qtdConsultas                 Int?

  // Exclusivos Diabetes
  hemoglobinaGlicada           String?
  dataAvaliacaoHbA1c           DateTime?
  dataSolicitacaoHbA1c         DateTime?
  dataAvaliacaoPes             DateTime?
  consultasUltimos36Meses      Int?

  @@index([bairro])
  @@index([uploadId])
  @@index([mesesUltimoAtendMedico])
  @@index([mesesUltimaVisitaDomiciliar])
  @@index([mesesUltimoAtendEnfermagem])
}
```

---

### 4.6 Fluxo de Dados — Upload

```
Enfermeiro faz upload do arquivo (.xls / .csv)
          ↓
Server Action: upload.actions.ts
  → Zod valida o input (tipo de arquivo, tamanho)
          ↓
ProcessarUploadUseCase.execute()
  → SheetJSFileParser.parse()              (Infrastructure)
  → HipertensaoParser ou DiabetesParser   (Infrastructure)
  → Paciente.create() para cada linha     (Domain)
          ↓
PrismaUploadRepository.save()             (Infrastructure)
PrismaPacienteRepository.createMany()     (Infrastructure)
          ↓
revalidatePath('/') → dashboard atualiza automaticamente
```

### 4.7 Fluxo de Dados — Dashboard

```
Usuário aplica filtros no client
          ↓
Server Component com searchParams
          ↓
GerarIndicadoresUseCase.execute(filtros: FiltrosPacienteDTO)
  → Zod valida FiltrosPacienteDTO
  → IPacienteRepository.findMany(filtros)     (contrato)
  → PrismaPacienteRepository executa query   (implementação)
  → IndicadorService.calcular(pacientes)     (Domain — puro, testável)
          ↓
IndicadorMapper → IndicadoresViewModel
          ↓
Server Component → Cards.tsx e Graficos.tsx
  → cache() do Next.js 15 para queries repetidas
```

---

## 5. Mapa de Telas

| Tela | Rota | Quem acessa |
|---|---|---|
| Login | `/login` | Todos |
| Dashboard principal | `/` | Todos (conteúdo varia por perfil) |
| Lista de pacientes | `/pacientes` | Todos (ACS: só seu bairro) |
| Importar dados | `/importar` | Enfermeiro(a) |
| Configurações | `/configuracoes` | Gestor |

---

## 6. Requisitos Não-Funcionais

| Requisito | Critério |
|---|---|
| Performance | Dashboard < 3s com até 10.000 pacientes; usar `cache()` do Next.js 15 nas queries |
| Responsividade | Desktop (1280px+) obrigatório · Mobile na v2 |
| Navegadores | Chrome 110+ · Firefox 110+ · Edge 110+ |
| LGPD | Zero tráfego de dados de pacientes para serviços externos |
| Segurança | HTTPS · bcrypt · JWT com expiração · Guards no middleware |
| Testabilidade | Cobertura mínima de 80% nas camadas Domain e Application |
| Acessibilidade | WCAG AA · Labels em todos os inputs (shadcn/ui já garante) |

---

## 7. Variáveis de Ambiente

```env
# .env.local

DATABASE_URL="postgresql://user:password@host:5432/dashboard_cronico"
NEXTAUTH_SECRET="gere-com: openssl rand -base64 32"
NEXTAUTH_URL="https://seu-dominio.com.br"
```

---

## 8. Roadmap de Entrega

| Fase | Prazo | Escopo |
|---|---|---|
| v0.1 | Semana 1–2 | Setup Next.js 15 + Prisma + PostgreSQL + estrutura Clean Arch + autenticação |
| v0.2 | Semana 3–4 | Domain entities + repositórios + Server Action de upload + parsers |
| v0.3 | Semana 5–6 | Use cases de indicadores + cards do dashboard + filtros principais |
| v0.4 | Semana 7–8 | Gráficos + filtros secundários + tabela de pacientes |
| v1.0 | Semana 9–10 | Exportação + controle de acesso por perfil + testes + ajustes de UX |
| v1.1+ | Futuro | Notificações · Comparativo histórico · PWA offline · Integração e-SUS |

---

## 9. Pontos em Aberto

| Questão | Impacto |
|---|---|
| Vercel + Neon (nuvem) ou VPS on-premise da secretaria? | Define DevOps e conformidade com política de dados |
| Uma UBS ou múltiplas compartilhando o sistema? | Pode exigir multi-tenancy no schema |
| Nome e identidade visual do sistema? | Logo, cores, nome |
| Notificações automáticas (WhatsApp / e-mail)? | Adiciona integração com serviços externos |
| Cada enfermeiro vê só os seus dados ou toda a equipe? | Muda modelo de permissões |
| Integração automática com e-SUS no futuro? | Pode substituir o upload manual |

---

*Especificação v1.2 — Next.js 15 · PostgreSQL · Prisma · NextAuth.js v5 · Clean Architecture · SOLID · Clean Code*
