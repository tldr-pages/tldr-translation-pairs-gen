type LanguageMapping = {
  sourceLanguage: string;
  targetLanguage: string;
  sourceString: string;
  targetString: string;
}

type PageStats = {
  /** The total number of tldr pages. */
  totalPages: int;

  /** The number of available languages. */
  totalAvailableLanguaged: int;

  /** The total number of unique binaries documented. */
  totalBinaries: int;
}

/** A command example in a tldr page. */
type Example = {
  description: string;
  command: string;
}

/**
 * Interface to write data to a particular location.
 *
 * Call {@link write} to write data out to the location, then call
 * {@link finished} when finished.
 */
export interface Writer {

  /**
   * Queues data to be written. This could either write data
   * directly to a stream, or collect data to be written on {@link finished}.
   *
   * @param data Any arbitrary data to write out.
   */
  write(data: unknown);

  /**
   * Saves the data if necessary and closes any resources taken up
   * by the the writer.
   */
  finished();
}
