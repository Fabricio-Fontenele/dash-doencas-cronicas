export class FileParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileParsingError";
  }
}
