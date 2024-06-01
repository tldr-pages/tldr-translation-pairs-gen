import path from 'path';
import fg from 'fast-glob';
import { Lexer } from 'marked';
import { TldrFile } from '../lib/tldr-file';
import { TldrPage } from '../lib/tldr-page';
import { Example, LanguageMapping, Writer } from '../types/tldr-pages';
import { getWriterForFile } from '../writers/writer-factory';

/**
 * Matches token in tldr pages. Tokens are wrapped in curly braces, and have a
 * prefix of "{{" and suffix of "}}".
 */
const TOKEN_PATTERN = /(?<=\{\{)[^{]+?(?=\}\})/g;

/** String to replace token syntax with during normalization. */
const TOKEN_NORMALIZED = '…';

/**
 * @param source Path to search for tldr pages from.
 * @returns Array of paths to tldr pages.
 */

async function collectTldrPages(source: string): Promise<string[]> {
  try {
    const files: string[] = await fg(`${source}/pages*/**/*.md`);
    return files;
  } catch (error) {
    console.error(`Error collecting TLDR pages: ${error}`);
    return [];
  }
}

/**
 * @returns Language directories mapped to the respective language, excluding the source directory.
 */
function getSupportedLanguages(tldrPageFiles: TldrFile[]): Set<string> {
  const languages = tldrPageFiles.map((tldrPageFile) => tldrPageFile.language);
  return new Set(languages);
}

/**
 * @param tldrPages Paths to tldr pages.
 * @returns Metadata of the tldr pages by parsing the file path.
 */
export function parseTldrPaths(tldrPages: string[]): TldrFile[] {
  return tldrPages.map((page) => {
    const absolutePath = path.resolve(page);
    const pathComponents = absolutePath.split(path.sep);
    const length = pathComponents.length;

    const language = pathComponents[length - 3].split('.')[1] || 'en';
    const system = pathComponents[length - 2];
    const command = pathComponents[length - 1].split('.')[0];

    return new TldrFile(absolutePath, language, system, command);
  });
}

/**
 * @param source Contents of a tldr page.
 * @returns Mapping of the data of a tldr page to an object.
 */
export function parseTldrPage(source: string): TldrPage {
  const lexer = new Lexer();
  const markdownTokens = lexer.lex(source);

  if (markdownTokens[0].type !== 'heading' || markdownTokens[1].type !== 'blockquote') {
    throw new Error('Malformed tldr page provided.');
  }

  const name = markdownTokens[0].text;
  const descriptionText = markdownTokens[1].tokens?.[0];

  if (descriptionText?.type !== 'paragraph') {
    throw new Error('Malformed tldr page provided.');
  }

  const descriptionTokens = descriptionText.tokens;
  const hasMoreInfo = descriptionTokens?.[descriptionTokens.length - 2]?.type === 'link';

  let description = '';
  let moreInfo;

  if (!hasMoreInfo) {
    description = markdownTokens[1].text;
  } else {
    for (let i = 0; i <= descriptionTokens.length - 4; i++) {
      description += descriptionTokens[i].raw;
    }

    const descriptionSeparator = descriptionTokens[descriptionTokens.length - 3].raw.split('\n');
    description += descriptionSeparator[0];
    moreInfo = descriptionSeparator[1];

    for (let i = descriptionTokens.length - 2; i < descriptionTokens.length; i++) {
      moreInfo += descriptionTokens[i].raw;
    }
  }

  const examples: Example[] = [];

  let index = 2;

  while (index < markdownTokens.length) {
    if (markdownTokens[index].type !== 'list' || markdownTokens[index + 2].type !== 'paragraph') {
      throw new Error('Malformed tldr page provided.');
    }

    const description = (markdownTokens[index] as any).items[0].text;

    const example: Example = {
      description: description.substring(0, description.length - 1),
      command: (markdownTokens[index + 2] as any).tokens[0].text
    }

    examples.push(example);
    index += 4;
  }

  return new TldrPage(name, description, examples, moreInfo);
}

/**
 * @param array Any array of items.
 * @param predicate How to determine if an item is a duplicate.
 * @returns New array where only unique items are preserved. (i.e. [1, 2, 2, 3] → [1, 3])
 */
export function unique<T>(array: T[], predicate: (a: T, b: T) => boolean) {
  const ignored: T[] = [];

  return array.reduce((acc: T[], current: any) => {
    const index = acc.findIndex((item) => predicate(item, current));

    if (index === -1) {
      if (ignored.findIndex((item2) => predicate(item2, current)) === -1) {
        acc.push(current);
      }

      return acc;
    }

    ignored.push(current);
    acc.splice(index, 1);
    return acc;
  }, []);
}

/**
 * @param body Arbitrary string to normalize.
 * @returns New string where all token syntax is replaced with a predictable string.
 */
export function normalize(body: string) {
  return body.replace(TOKEN_PATTERN, TOKEN_NORMALIZED);
}

export function findTranslations(sourcePage: TldrPage, sourceLanguage: string, targetPage: TldrPage, targetLanguage: string): LanguageMapping[] {
  const results: LanguageMapping[] = [];

  results.push({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
    sourceString: sourcePage.description,
    targetString: targetPage.description
  });

  if (sourcePage.hasMoreInfoLink() && targetPage.hasMoreInfoLink()) {
    results.push({
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      sourceString: sourcePage.moreInfo!,
      targetString: targetPage.moreInfo!
    });
  }

  const predicate = (a: Example, b: Example) => {
    return normalize(a.command) === normalize(b.command)
  };

  const sourceExamplesUnique = unique(sourcePage.examples, predicate);
  const targetExamplesUnique = unique(targetPage.examples, predicate);

  for (const targetExample of targetExamplesUnique) {
    const sourceExample = sourceExamplesUnique.find((example: Example) => {
      return predicate(example, targetExample);
    });

    if (!sourceExample) {
      continue;
    }

    results.push({
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      sourceString: sourceExample.description,
      targetString: targetExample.description
    });
  }

  return results;
}

/**
 * @param source Path to tldr-pages on disk.
 * @param output Location to write the dataset to.
 * @param targetFormat The desired format to write the dataset in.
 */
export async function execute(source: string, output: string, targetFormat: string) {
  const tldrPagePaths = await collectTldrPages(source);
  const tldrPageFiles = parseTldrPaths(tldrPagePaths);
  const languages = getSupportedLanguages(tldrPageFiles);
  const languageCombinations = getSortedCombinations([...languages]);

  const skippedPaths = new Set<string>();

  for (const combo of languageCombinations) {
    const sourceFiles = tldrPageFiles.filter((file) => file.language === combo[0]);
    let writer: Writer | undefined = undefined;

    for (const sourceFile of sourceFiles) {
      const sourceIntegrity = await sourceFile.verifyIntegrity();

      if (!sourceIntegrity) {
        skippedPaths.add(sourceFile.path);
        continue;
      }

      let sourcePage: TldrPage | undefined = undefined;

      const targetFile = tldrPageFiles.find((tldrPageFile) => {
        return tldrPageFile.language == combo[1] && tldrPageFile.isInternationalizedVariant(sourceFile);
      });

      if (!targetFile) {
        continue;
      }

      const targetIntegrity = await targetFile.verifyIntegrity();

      if (!targetIntegrity) {
        skippedPaths.add(targetFile.path);
        continue;
      }

      const targetPage = await targetFile.read();

      if (sourcePage === undefined) {
        sourcePage = await sourceFile.read();
      }

      if (writer === undefined) {
        writer = getWriterForFile(path.join(output, `${combo[0]}-${combo[1]}.${targetFormat}`), targetFormat);
      }

      const mappings = findTranslations(sourcePage, combo[0], targetPage, combo[1]);

      for (const mapping of mappings) {
        writer.write(mapping);
      }
    }

    if (writer) {
      writer.finished();
    }

    console.log(`Finished processing pages for ${combo[0]}-${combo[1]}.`);
  }

  console.log('Finished processing all pages.');

  if (skippedPaths.size !== 0) {
    console.warn('\nWARNING: Skipped the following page(s) as they appear to be malformed:');

    for (const skippedPath of skippedPaths) {
      console.warn('*', skippedPath);
    }
  }
}

/**
 * While each combination in the array is sorted, the top-level array itself is
 * not.
 *
 * @param arr Any arbitrary array of items.
 * @returns All combinations of 2 items in the list, each individual combination sorted.
 */
export function getSortedCombinations<T>(arr: T[]): T[][] {
  const result = arr.flatMap(
      (val, i) => arr.slice(i + 1).map((word) => [val, word].sort())
  );

  return result;
}
