import fs from 'fs';
import { LanguageMapping } from '../lib/lib';
import { Writer } from './writer';

export class JsonWriter implements Writer {

  private accumulatedData: unknown[];

  constructor(private output: string) {
    this.accumulatedData = [];
  }

  write(data: LanguageMapping) {
    this.accumulatedData.push(data);
  }

  finished() {
    fs.writeFile(this.output, JSON.stringify(this.accumulatedData, undefined, 2), () => undefined);
  }
}
