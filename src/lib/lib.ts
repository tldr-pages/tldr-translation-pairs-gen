import path from 'path';
import glob from 'glob';
import { Lexer } from 'marked';
import { promisify } from 'util';
import { TldrFile } from '../lib/tldr-file';
import { TldrPage } from '../lib/tldr-page';
import { Example, LanguageMapping } from '../types/tldr-pages';
import { getWriterForFile } from '../writers/writer-factory';

const TOKEN_PATTERN = /(?<=\{\{)[^{]+?(?=\}\})/g;
const TOKEN_NORMALIZED = '…';

function collectTldrPages(source: string): Promise<string[]> {
  const globAsync = promisify(glob);
  return globAsync(`${source}/pages*/**/*.md`);
}

/**
 * @returns {object} Language directories mapped to the respective language, excluding the source directory.
 */
function getAvailableLanguages(tldrPageFiles: TldrFile[]): Set<string> {
  const languages = tldrPageFiles.map((tldrPageFile) => tldrPageFile.language);
  return new Set(languages);
}

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
    throw new Error('Invalid tldr page provided.');
  }

  const name = markdownTokens[0].text;
  const descriptionText = markdownTokens[1].tokens[0];

  if (descriptionText.type !== 'paragraph') {
    throw new Error('Invalid tldr page provided.');
  }

  const descriptionTokens = descriptionText.tokens;

  const hasMoreInfo = descriptionTokens[descriptionTokens.length - 2]?.type === 'link';

  let description = '';
  let moreInfo;

  if (!hasMoreInfo) {
    description = markdownTokens[1].text;
  } else {
    for (let i = 0; i <= descriptionTokens.length - 4; i++) {
      description += descriptionTokens[i].raw;
    }

    const descriptionSeperator = descriptionTokens[descriptionTokens.length - 3].raw.split('\n');
    description += descriptionSeperator[0];
    moreInfo = descriptionSeperator[1];

    for (let i = descriptionTokens.length - 2; i < descriptionTokens.length; i++) {
      moreInfo += descriptionTokens[i].raw;
    }
  }

  const examples: Example[] = [];

  let index = 2;

  while (index < markdownTokens.length) {
    if (markdownTokens[index].type !== 'list' || markdownTokens[index + 2].type !== 'paragraph') {
      throw new Error('Invalid tldr page provided.');
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

export function normalize(text: string) {
  return text.replace(TOKEN_PATTERN, TOKEN_NORMALIZED);
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
 * @param sourceLanguage The source format to output translations from.
 */
export async function execute(source: string, sourceLanguage: string, output: string, targetFormat: string) {
  const tldrPagePaths = await collectTldrPages(source);
  const tldrPageFiles = parseTldrPaths(tldrPagePaths);

  const sourceTldrFiles = tldrPageFiles.filter((file) => file.language === sourceLanguage);
  const languages = getAvailableLanguages(tldrPageFiles);
  languages.delete(sourceLanguage);

  const writer = getWriterForFile(output, targetFormat);

  const totalPages = sourceTldrFiles.length;
  const uiSteps = Math.ceil(totalPages / 10);
  let processedPages = 0;

  for (const sourceTldrFile of sourceTldrFiles) {
    let sourcePage: TldrPage | undefined = undefined;

    for (const language of languages) {
      const targetFile = tldrPageFiles.find((tldrPageFile) => {
        return tldrPageFile.language == language && tldrPageFile.isInternationalizedVariant(sourceTldrFile);
      });

      if (!targetFile) {
        continue;
      }

      const targetPage = await targetFile.read();

      if (sourcePage === undefined) {
        sourcePage = await sourceTldrFile.read();
      }

      const mappings = findTranslations(sourcePage, sourceLanguage, targetPage, language);

      for (const mapping of mappings) {
        writer.write(mapping);
      }
    }

    processedPages++;

    if (processedPages % uiSteps === 0) {
      process.stdout.write(`Processed ${processedPages} of ${totalPages} pages. (${Math.round(processedPages / totalPages * 100)}%)`);

      const wasLastProgressLog = totalPages - processedPages <= uiSteps;
      process.stdout.write((wasLastProgressLog) ? '\n' : '\r');
    }
  }

  writer.finished();
  console.log('Finished processing all pages.');
}
