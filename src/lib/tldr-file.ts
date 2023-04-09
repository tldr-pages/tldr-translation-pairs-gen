import fs from 'fs';
import type { TldrPage } from './tldr-page';
import { parseTldrPage } from './lib';

/**
 * @since 0.1.0
 */
export class TldrFile {

  /**
   * @param path Absolute path to the file on disk.
   * @param language ISO language code this file is for.
   * @param system Name of the operating system this file is documented for.
   * @param command Name of the command this file documents.
   * @since 0.1.0
   */
  public constructor(public path: string, public language: string, public system: string, public command: string) {

  }

  /**
   * This only returns true when provided 2 different tldr pages. This function
   * will intentionally return false if the same page is passed in, as the same
   * page is not an internationalized variant.
   *
   * @param targetTldrFile The tldr page to compare this against.
   * @returns If this and the target tldr pages document the same command.
   */
  public isInternationalizedVariant(targetTldrFile: TldrFile): boolean {
    if (this.command !== targetTldrFile.command) {
      return false;
    }

    if (this.system !== targetTldrFile.system) {
      return false;
    }

    if (this.language === targetTldrFile.language) {
      return false;
    }

    return true;
  }

  /**
   * Reads the tldr page from disk.
   *
   * @returns Contents of the tldr page.
   */
  public async read(): Promise<TldrPage> {
    const pageString = await fs.promises.readFile(this.path, 'utf8');
    const tldrPage = parseTldrPage(pageString);
    return tldrPage;
  }

  /**
   * Perform checks to ensure there is nothing unexpected about the tldr page.
   * This attempts to catch errors that occur in the tldr repository and work
   * around them to avoid crashes.
   *
   * @returns If the file is fine to process.
   */
  public async verifyIntegrity(): Promise<boolean> {
    const stats = await fs.promises.lstat(this.path);
    return !stats.isDirectory();
  }
}
