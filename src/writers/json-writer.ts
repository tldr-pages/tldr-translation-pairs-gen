import fs from 'fs';
import { LanguageMapping } from '../lib/lib';
import { Writer } from './writer';

export class JsonWriter implements Writer {

  private accumlatedData: unknown[];

  constructor(private output: string) {
    this.accumlatedData = [];
  }

  write(data: LanguageMapping) {
    this.accumlatedData.push(data);
  }

  finished() {
    fs.writeFile(this.output, JSON.stringify(this.accumlatedData, undefined, 2), () => undefined);
  }
}
