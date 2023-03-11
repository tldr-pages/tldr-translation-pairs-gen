import fs from 'fs';
import { create } from 'xmlbuilder2';
import { XMLBuilderCreateOptions } from 'xmlbuilder2/lib/interfaces';
import { LanguageMapping, Writer } from '../types/tldr-pages';

export class XmlWriter implements Writer {

  private root;

  constructor(private output: string) {
    const options: XMLBuilderCreateOptions = {
      version: "1.0",
      encoding: "UTF-8"
    };

    this.root = create(options).ele("mappings");
  }

  write(data: LanguageMapping) {
    this.root = this.root.ele("mapping")
      .ele("srclang").txt(data.sourceLanguage).up()
      .ele("targetlang").txt(data.targetLanguage).up()
      .ele("source").txt(data.sourceString).up()
      .ele("target").txt(data.targetString).up()
      .up();
  }

  finished() {
    const xmlString = this.root.end({ prettyPrint: true });
    fs.writeFile(this.output, xmlString, () => undefined);
  }
}
