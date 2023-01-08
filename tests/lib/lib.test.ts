import { describe } from 'node:test';
import { assert } from 'chai';
import { findTranslations, normalize, parseTldrPage, parseTldrPaths, unique } from '../../src/lib/lib';
import { TldrFile } from '../../src/lib/tldr-file';
import { TldrPage } from '../../src/lib/tldr-page';
import { Example, LanguageMapping } from '../../src/types/tldr-pages';

describe('#parseTldrPaths', () => {

  it('parse path of tldr page into an object', () => {
    const expected: TldrFile[] = [
      new TldrFile('/tldr/pages/common/docker-compose.md', 'en', 'common', 'docker-compose')
    ];

    const actual = parseTldrPaths(['/tldr/pages/common/docker-compose.md']);

    assert.deepStrictEqual(actual, expected);
  });
});

describe('#parseTldrPage', () => {

  it('parse the contents of a tldr page into an object', () => {
    const asPageContent = '# as\n\n> Portable GNU assembler.\n> Primarily intended to assemble output from `gcc` to be used by `ld`.\n> More information: <https://www.unix.com/man-page/osx/1/as/>.\n\n- Assemble a file, writing the output to `a.out`:\n\n`as {{file.s}}`\n\n- Assemble the output to a given file:\n\n`as {{file.s}} -o {{out.o}}`\n\n- Generate output faster by skipping whitespace and comment preprocessing. (Should only be used for trusted compilers):\n\n`as -f {{file.s}}`\n\n- Include a given path to the list of directories to search for files specified in `.include` directives:\n\n`as -I {{path/to/directory}} {{file.s}}`\n';

    const expected = new TldrPage(
      'as',
      'Portable GNU assembler.\nPrimarily intended to assemble output from `gcc` to be used by `ld`.',
      [
        {
          description: 'Assemble a file, writing the output to `a.out`',
          command: 'as {{file.s}}'
        },
        {
          description: 'Assemble the output to a given file',
          command: 'as {{file.s}} -o {{out.o}}'
        },
        {
          description: 'Generate output faster by skipping whitespace and comment preprocessing. (Should only be used for trusted compilers)',
          command: 'as -f {{file.s}}'
        },
        {
          description: 'Include a given path to the list of directories to search for files specified in `.include` directives',
          command: 'as -I {{path/to/directory}} {{file.s}}'
        }
      ],
      'More information: <https://www.unix.com/man-page/osx/1/as/>.'
    );

    const actual = parseTldrPage(asPageContent);

    assert.deepStrictEqual(actual, expected);
  });

  it('parse the contents of a tldr alias page into an object', () => {
    const tldrlPageContent = '# tldrl\n\n> This command is an alias of `tldr-lint`.\n> More information: <https://github.com/tldr-pages/tldr-lint>.\n\n- View documentation for the original command:\n\n`tldr tldr-lint`\n';

    const expected = new TldrPage(
      'tldrl',
      'This command is an alias of `tldr-lint`.',
      [
        {
          description: 'View documentation for the original command',
          command: 'tldr tldr-lint'
        }
      ],
      'More information: <https://github.com/tldr-pages/tldr-lint>.'
    );

    const actual = parseTldrPage(tldrlPageContent);

    assert.deepStrictEqual(actual, expected);
  });
});

describe('#unique', () => {

  it('removes duplicates (2 equal items) from array', () => {
    const expected = [1, 3];
    const actual = unique([1, 2, 2, 3], (a, b) => a === b);

    assert.deepStrictEqual(actual, expected);
  });

  it('removes duplicates (3 equal items) from array', () => {
    const expected = [1, 3];
    const actual = unique([1, 2, 2, 2, 3], (a, b) => a === b);

    assert.deepStrictEqual(actual, expected);
  });

  /*
   * Becasue the text between curly braces can be internationalized, we'll
   * remove them from the command before treating
   */
  it('removes duplicates (nested item) from array', () => {
    const examples: Example[] = [
      {
        description: 'List devices with changeable brightness',
        command: 'brightnessctl --list'
      },
      {
        description: 'Print the current brightness of the display backlight',
        command: 'brightnessctl get'
      },
      {
        description: 'Increase brightness by a specified increment',
        command: 'brightnessctl set {{+10%}}'
      },
      {
        description: 'Decrease brightness by a specified decrement',
        command: 'brightnessctl set {{10%-}}'
      }
    ];

    const expected: Example[] = [
      {
        description: 'List devices with changeable brightness',
        command: 'brightnessctl --list'
      },
      {
        description: 'Print the current brightness of the display backlight',
        command: 'brightnessctl get'
      }
    ];

    const actual = unique(examples, (a: Example, b: Example) => {
      return a.command.replace(/\{\{.+?\}\}/g, '{{}}') === b.command.replace(/\{\{.+?\}\}/g, '{{}}')
    });

    assert.deepStrictEqual(actual, expected);
  });
});

describe('#normalize', () => {

  it('doesn\'t break commands with no tokens', () => {
    const expected = 'curl --version';
    const actual = normalize('curl --version');

    assert.strictEqual(actual, expected);
  });

  it('removes tokens from command', () => {
    const expected = 'input tap {{…}} {{…}}';
    const actual = normalize('input tap {{x_pos}} {{y_pos}}');

    assert.strictEqual(actual, expected);
  });

  it('removes tokens from command that\'s wrapped in curly braces', () => {
    const expected = 'for {{…}} in {{{…}}..{{…}}..{{…}}}; do {{…}}; done';
    const actual = normalize('for {{variable}} in {{{from}}..{{to}}..{{step}}}; do {{echo "Loop is executed"}}; done');

    assert.strictEqual(actual, expected);
  });
});

describe('#findTranslations', () => {

  it('find the translations between 2 tldr-pages', () => {
    const enPage = new TldrPage(
      'tldr',
      'Display simple help pages for command-line tools from the tldr-pages project.',
      [
        {
          description: 'Print the tldr page for a specific command (hint: this is how you got here!)',
          command: 'tldr {{command}}'
        },
        {
          description: 'Print the tldr page for a specific subcommand',
          command: 'tldr {{command}}-{{subcommand}}'
        },
        {
          description: 'Print the tldr page for a command for a specific [p]latform',
          command: 'tldr -p {{android|linux|osx|sunos|windows}} {{command}}'
        },
        {
          description: '[u]pdate the local cache of tldr pages',
          command: 'tldr -u'
        }
      ],
      'More information: <https://tldr.sh>.'
    );

    const dePage = new TldrPage(
      'tldr',
      'Zeigt kurze Zusammenfassungen (tldr-Seiten) von Kommandozeilen-Befehlen an.',
      [
        {
          description: 'Zeige die tldr-Seite für einen Befehl an (Hinweis: So bist du hierher gekommen!)',
          command: 'tldr {{befehl}}'
        },
        {
          description: 'Zeige die tldr-Seite für `cd` an und überschreibe die Standardplattform',
          command: 'tldr -p {{android|linux|osx|sunos|windows}} {{cd}}'
        },
        {
          description: 'Zeige die tldr-Seite für einen Unterbefehl',
          command: 'tldr {{git-checkout}}'
        },
        {
          description: 'Aktualisiere die lokalen Seiten (wenn er Client Caching unterstützt)',
          command: 'tldr -u'
        }
      ],
      'Weitere Informationen: <https://tldr.sh>.'
    );

    const expected: LanguageMapping[] = [
      {
        sourceLanguage: 'en',
        targetLanguage: 'de',
        sourceString: 'Display simple help pages for command-line tools from the tldr-pages project.',
        targetString: 'Zeigt kurze Zusammenfassungen (tldr-Seiten) von Kommandozeilen-Befehlen an.'
      },
      {
        sourceLanguage: 'en',
        targetLanguage: 'de',
        sourceString: 'More information: <https://tldr.sh>.',
        targetString: 'Weitere Informationen: <https://tldr.sh>.'
      },
      {
        sourceLanguage: 'en',
        targetLanguage: 'de',
        sourceString: 'Print the tldr page for a command for a specific [p]latform',
        targetString: 'Zeige die tldr-Seite für `cd` an und überschreibe die Standardplattform'
      },
      {
        sourceLanguage: 'en',
        targetLanguage: 'de',
        sourceString: '[u]pdate the local cache of tldr pages',
        targetString: 'Aktualisiere die lokalen Seiten (wenn er Client Caching unterstützt)'
      }
    ];

    const actual = findTranslations(enPage, 'en', dePage, 'de');

    assert.deepStrictEqual(expected, actual);
  });
});
