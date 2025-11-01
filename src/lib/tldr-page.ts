/** Command example in a tldr page. */
export type Example = {
  description: string;
  command: string;
}

/**
 * @since 0.1.0
 */
export class TldrPage {

  /**
   * @param name Name of the command the tldr page documents.
   * @param description Description of the command in tldr page.
   * @param examples Example usage of the command.
   * @param moreInfo Link to more information about the command.
   * @since 0.1.0
   */
  public constructor(public name: string, public description: string, public examples: Example[], public moreInfo?: string) {

  }

  /**
   * @returns If the description of this page included a link for more information.
   */
  public hasMoreInfoLink(): boolean {
    return this.moreInfo !== undefined;
  }

  /**
   * In tldr-pages, the description and more information links are written
   * together. This returns the full description as written in tldr-pages,
   * rather than splitting it up into smaller properties.
   *
   * @returns Full description as written in tldr-pages.
   * @since 0.1.0
   */
  public getFullDescription(): string {
    if (this.hasMoreInfoLink()) {
      return this.description + '\n' + this.moreInfo;
    }

    return this.description;
  }
}
