import { Writer } from '../types/tldr-pages';
import { CsvWriter } from '../writers/csv-writer';
import { JsonWriter } from '../writers/json-writer';
import { XmlWriter } from '../writers/xml-writer';
import { TmxWriter } from './tmx-writer';

/**
 * @param output Path to output the file to.
 * @returns Respective writer for the file extension in the output parameter.
 */
export function getWriterForFile(output: string, targetFormat: string): Writer {
  if (!targetFormat) {
    throw new Error('No format specified.');
  }

  switch (targetFormat.toLowerCase()) {
    case 'tmx':
      return new TmxWriter(output);
    case 'xml':
      return new XmlWriter(output);
    case 'csv':
      return new CsvWriter(output);
    case 'json':
      return new JsonWriter(output);
    default:
      throw new Error(`Unable to write file, unsupported format (${targetFormat}).`);
  }
}
