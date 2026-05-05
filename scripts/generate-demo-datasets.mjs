import fs from "node:fs";
import path from "node:path";

const DATASETS_DIRECTORY = path.resolve("datasets");

const firstNames = [
  "Ana",
  "Maria",
  "Joao",
  "Jose",
  "Francisca",
  "Antonio",
  "Adriana",
  "Paulo",
  "Patricia",
  "Raimundo",
  "Claudia",
  "Carlos",
  "Marta",
  "Luciana",
  "Fabio",
  "Renata",
  "Pedro",
  "Juliana",
  "Marcos",
  "Simone",
  "Camila",
  "Diego",
  "Fabiana",
  "Silvia",
  "Roberto",
];

const lastNames = [
  "Silva",
  "Souza",
  "Oliveira",
  "Santos",
  "Lima",
  "Costa",
  "Pereira",
  "Ferreira",
  "Almeida",
  "Rodrigues",
  "Carvalho",
  "Gomes",
  "Araujo",
  "Barbosa",
  "Melo",
];

const neighborhoods = [
  "Centro",
  "Bela Vista",
  "Sao Jose",
  "Piçarra",
  "Dirceu",
  "Promorar",
  "Mocambinho",
  "Buenos Aires",
  "Primavera",
  "Santa Maria",
  "Angelim",
  "Itarare",
];

const races = [
  "Parda",
  "Branca",
  "Preta",
  "Amarela",
  "Indigena",
];

const sexes = ["F", "M"];
const bloodPressureValues = ["120x80", "130x85", "140x90", "150x95", "110x70", "160x100"];

const headers = {
  common: [
    "Codigo",
    "Nome",
    "Idade",
    "Sexo",
    "Raça/cor",
    "Beneficiário Programa Bolsa Família",
    "Bairro",
    "Meses ultimo atend medico",
    "Meses ultimo atend enfermagem",
    "Meses ultima visita domiciliar",
    "Meses ultima medicao pressao arterial",
    "Ultima medicao de pressao arterial",
  ],
  diabetes: [
    "Meses ultima HbA1c",
    "Hemoglobina glicada",
  ],
};

function seededRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick(random, values) {
  return values[randomInt(random, 0, values.length - 1)];
}

function maybe(random, chance, whenTrue, whenFalse = "") {
  return random() <= chance ? whenTrue() : whenFalse;
}

function buildName(random) {
  return `${pick(random, firstNames)} ${pick(random, lastNames)}`;
}

function buildCommonRow(random, codePrefix, index) {
  const age = randomInt(random, 34, 89);
  const medicalMonths = randomInt(random, 0, 18);
  const nursingMonths = randomInt(random, 0, 16);
  const homeVisitMonths = randomInt(random, 0, 10);
  const bloodPressureMonths = randomInt(random, 0, 14);

  return [
    `${codePrefix}-${String(index + 1).padStart(3, "0")}`,
    buildName(random),
    String(age),
    pick(random, sexes),
    pick(random, races),
    random() > 0.72 ? "Sim" : "Nao",
    pick(random, neighborhoods),
    String(medicalMonths),
    String(nursingMonths),
    String(homeVisitMonths),
    String(bloodPressureMonths),
    maybe(
      random,
      0.82,
      () => pick(random, bloodPressureValues),
      "",
    ),
  ];
}

function buildDiabetesRow(random, index) {
  const common = buildCommonRow(random, "DBT", index);
  const hba1cMonths = randomInt(random, 0, 20);
  const hba1cValue = maybe(
    random,
    0.76,
    () => (randomInt(random, 55, 102) / 10).toFixed(1).replace(".", ","),
    "",
  );

  return [...common, String(hba1cMonths), hba1cValue];
}

function buildHipertensaoRow(random, index) {
  return buildCommonRow(random, "HIP", index);
}

function writeDataset(fileName, title, columns, rows) {
  const lines = [title, columns.join(";"), ...rows.map((row) => row.join(";"))];
  const filePath = path.join(DATASETS_DIRECTORY, fileName);

  fs.writeFileSync(filePath, `${lines.join("\r\n")}\r\n`, "latin1");
}

function generate() {
  const diabetesRandom = seededRandom(20260504);
  const hipertensaoRandom = seededRandom(20260505);

  const diabetesRows = Array.from({ length: 100 }, (_, index) =>
    buildDiabetesRow(diabetesRandom, index),
  );
  const hipertensaoRows = Array.from({ length: 100 }, (_, index) =>
    buildHipertensaoRow(hipertensaoRandom, index),
  );

  writeDataset(
    "Relatório de acompanhamento diabetes.csv.xls",
    "Relatorio de acompanhamento - Diabetes",
    [...headers.common, ...headers.diabetes],
    diabetesRows,
  );

  writeDataset(
    "Relatório acompanhamento hipertensão.csv.xls",
    "Relatorio de acompanhamento - Hipertensao",
    headers.common,
    hipertensaoRows,
  );
}

generate();
