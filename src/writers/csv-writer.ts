import fs from 'fs';
import { Stringifier, stringify } from 'csv-stringify';
import { LanguageMapping } from '../lib/lib';
import { Writer } from './writer';

export class CsvWriter implements Writer {

  private stream: Stringifier;

  constructor(private output: string) {
    this.stream = stringify({
      columns: [
        "sourceLanguage",
        "targetLanguage",
        "sourceString",
        "targetString"
      ],
      header: true,
      delimiter: ','
    });

    this.stream.on('readable', () => {
      let row;

      while((row = this.stream.read()) !== null) {
        fs.appendFile(this.output, row, () => undefined);
      }
    });
  }

  write(data: LanguageMapping) {
    this.stream.write(data);
  }

  finished() {
    this.stream.end();
  }
}
