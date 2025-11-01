import { CsvWriter } from './csv-writer';
import { JsonWriter } from './json-writer';
import { XmlWriter } from './xml-writer';
import { TmxWriter } from './tmx-writer';

/**
 * Interface to write data to a particular location.
 *
 * Call {@link write} to write data out to the location, then call
 * {@link finished} when finished.
 */
export interface Writer {

  /**
   * Queues data to be written. This could either write data directly to a
   * stream, or collect data to be written on {@link finished}.
   *
   * @param data Any arbitrary data to write out.
   */
  write(data: unknown): void;

  /**
   * Saves the data if necessary and closes any resources taken up by the the
   * writer.
   */
  finished(): void;
}


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
