import fs from 'fs';
import { create } from 'xmlbuilder2';
import { XMLBuilderCreateOptions, XMLWriterOptions } from 'xmlbuilder2/lib/interfaces';
import { VERSION } from '../constants';
import { LanguageMapping } from '../lib/lib';
import { Writer } from './writer';

/**
 * Writer to export in the TMX (Translation Memory eXchange) format.
 *
 * @see https://www.gala-global.org/tmx-14b
 * @since 0.2.0
 */
export class TmxWriter implements Writer {

  private root;

  constructor(private output: string) {
    const options: XMLBuilderCreateOptions = {
      version: "1.0",
      encoding: "UTF-8"
    };

    this.root = create(options)
      .ele("http://www.lisa.org/tmx14", "tmx", { version: "1.4" })
      .ele("header")
      .att("creationtool", "tldr-translation-dataset-gen")
      .att("creationtoolversion", VERSION)
      .att("segtype", "block")
      .att("adminlang", "en-US")
      .att("datatype", "plaintext")
      .att("o-encoding", "UTF-8")
      .att("creationdate", new Date().toISOString())
      .att("creationid", "tldr-pages team and contributors")
      .att("changeid", "tldr-pages team and contributors")
      .up()
      .ele("body");
  }

  /**
   * Appends a new translation unit (TU) entry to the XML.
   * Each translation unit contains translation unit varients (TUV).
   *
   * @param data
   */
  write(data: LanguageMapping) {
    this.root = this.root.ele("tu")
      .ele("tuv").att("xml:lang", data.sourceLanguage).ele("seg").txt(data.sourceString).up().up()
      .ele("tuv").att("xml:lang", data.targetLanguage).ele("seg").txt(data.targetString).up().up()
      .up();
  }

  finished() {
    const writerOptions: XMLWriterOptions = {
      prettyPrint: true
    };

    const xmlString = this.root.end(writerOptions);
    fs.writeFile(this.output, xmlString, () => undefined);
  }
}
