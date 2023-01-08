import fs from 'fs';
import { XMLBuilder } from 'fast-xml-parser';
import { Writer } from '../types/tldr-pages';

export class XmlWriter implements Writer {

  private accumlatedData: unknown[];
  private builder: XMLBuilder;

  constructor(private output: string) {
    this.accumlatedData = [];

    this.builder = new XMLBuilder({
      arrayNodeName: "mapping",
      format: true
    });
  }

  write(data: unknown) {
    this.accumlatedData.push(data);
  }

  finished() {
    const xmlString = this.builder.build(this.accumlatedData);
    fs.writeFile(this.output, xmlString, () => undefined);
  }
}
