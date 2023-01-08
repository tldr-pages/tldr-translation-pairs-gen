import fs from 'fs';
import { Writer } from '../types/tldr-pages';

export class JsonWriter implements Writer {

  private accumlatedData: unknown[];

  constructor(private output: string) {
    this.accumlatedData = [];
  }

  write(data: unknown) {
    this.accumlatedData.push(data);
  }

  finished() {
    fs.writeFile(this.output, JSON.stringify(this.accumlatedData, undefined, 2), () => undefined);
  }
}
