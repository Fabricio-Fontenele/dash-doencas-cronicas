import fs from "node:fs";
import path from "node:path";

const DATASET_PATH = path.resolve("datasets/misto-2k.csv");
const REFERENCE_DATE = new Date("2026-05-19T00:00:00-03:00");

const rows = fs.readFileSync(DATASET_PATH, "utf8").split(/\r?\n/).filter(Boolean);

if (rows.length < 2) {
  throw new Error("Dataset misto vazio ou inválido.");
}

const originalHeader = rows[0].split(";");
const medicalDaysIndex = originalHeader.indexOf("Dias desde o último atendimento médico");
const nursingDaysIndex = originalHeader.indexOf("Dias desde o último atendimento de enfermagem");
const dentalDaysIndex = originalHeader.indexOf("Dias desde o último atendimento odontológico");
const medicalDateIndex = originalHeader.indexOf("Data da última consulta");

if (
  medicalDaysIndex === -1 ||
  nursingDaysIndex === -1 ||
  dentalDaysIndex === -1 ||
  medicalDateIndex === -1
) {
  throw new Error("Cabeçalho inesperado em datasets/misto-2k.csv.");
}

const header = [...originalHeader];
header.splice(
  medicalDateIndex,
  0,
  "Data da última consulta médica",
  "Data da última consulta de enfermagem",
  "Data da última consulta odontológica",
);

function formatBrazilianDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function subtractDays(daysText) {
  const days = Number.parseInt(daysText, 10);

  if (Number.isNaN(days)) {
    return "";
  }

  const date = new Date(REFERENCE_DATE);
  date.setDate(date.getDate() - days);
  return formatBrazilianDate(date);
}

const updatedRows = rows.slice(1).map((line) => {
  const columns = line.split(";");
  const medicalDate = subtractDays(columns[medicalDaysIndex] ?? "");
  const nursingDate = subtractDays(columns[nursingDaysIndex] ?? "");
  const dentalDate = subtractDays(columns[dentalDaysIndex] ?? "");

  columns.splice(medicalDateIndex, 0, medicalDate, nursingDate, dentalDate);
  return columns.join(";");
});

fs.writeFileSync(DATASET_PATH, `${header.join(";")}\n${updatedRows.join("\n")}\n`, "utf8");

console.log(`Arquivo atualizado com datas clínicas explícitas: ${DATASET_PATH}`);
