<div align="center">
  <h1>tldr-translation-dataset-gen</h1>

[![Gitter chat][gitter-image]][gitter-url]
[![license][license-image]][license-url]

[gitter-url]: https://gitter.im/tldr-pages/tldr
[gitter-image]: https://img.shields.io/badge/chat-on_gitter-deeppink
[license-url]: https://github.com/tldr-pages/tldr-translation-dataset-gen/blob/main/LICENSE.md
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
</div>

## About

This is a CLI application for parsing all tldr pages from the [tldr-pages/tldr](https://github.com/tldr-pages/tldr) repository, and creating a dataset that maps the translations in internationalized pages. The primary purpose is to provide an additional dataset for [OPUS](https://opus.nlpl.eu/), a collection of translated resources from the web, readily available in a standardised format for by other tools or research.

### What is OPUS?

[OPUS](https://opus.nlpl.eu/) is public dataset of translated text on the web. All translations are derived from freely available and openly licensed sources, so the translations themselves are safe to use with minimal restrictions. These datasets are helpful for a variety of applications such as research and machine learning.

A notable project that uses the OPUS dataset is [LibreTranslate](https://libretranslate.com/), powered by [argos-translate](https://github.com/argosopentech/argos-translate/). It's a free, open-source, and self-hostable machine translation API that doesn't depend on third-party services. Now by contributing translations to tldr-pages, we're collectively providing more data that will be used to improve machine translations and support additional languages.

## Usage

### Obtain a copy of tldr-pages

One way or another, obtain a copy of the tldr-pages. The easiest way is to use [Git](https://git-scm.com/).

```sh
git clone https://github.com/tldr-pages/tldr.git
```

### Execute tldr-translation-dataset-gen

Once you have tldr-pages locally, you should be able to point tldr-translation-dataset-gen to the directory using the `--source` argument. This will export a `dataset.xml` file with all mappings that can be found between translated pages.

```sh
tldr-translation-dataset-gen --source {{path/to/sources}}
```

You can also pass a `--output` argument to specify a different file location. The supported file formats are CSV, JSON, and XML, which can be specified by using the appropriate file extension in the output argument.

```sh
tldr-translation-dataset-gen --source {{path/to/sources}} --output dataset.json
```

## Excluded Strings

When generating the dataset, you'll find that not all strings are included. Due to how the project is structured, and the current translation workflow, there are instances where the order or number of examples differ. This results in the internationalized pages falling out of sync.

Each example in a page features two strings, the description of what the command does, and the command itself. To work around the aforementioned issue, we parse each example and use the command as an identifier.

To map strings between languages, we parse all examples, remove tokens between curly braces (i.e. `{{path/to/file}}`) as they can be internationalized, and then find the pairing example in the page of other languages if it exists.

However, sometimes after removing the content between curly braces, two or more examples in the same page may have the same content because the only difference was the tokens. In these case, we omit them from dataset as there is no way to umabiguously know which command is the pairing example.

Here is a real-world example of the problem, the English version was modified after the German translation was made, so now the pages have fallen out of sync. If we made pairs using the index, we'd create mismatches.

| [EN](https://github.com/tldr-pages/tldr/blob/77decbbb90597baa942e224da2138477d273fc86/pages/common/tldr.md) | [FR](https://github.com/SethFalco/tldr/blob/051d085b7b684aec7413e2ea2ea36cc24406ce16/pages.fr/common/tldr.md) |
|---|---|
| - Print the tldr page for a specific command (hint: this is how you got here!): <br><br> `tldr {{command}}` | - Affiche la page tldr d'une commande (indice : c'est comme ça que vous êtes arrivé ici !) : <br><br> `tldr {{commande}}`
| - Print the tldr page for a specific subcommand: <br><br> `tldr {{command}}-{{subcommand}}` | - Affiche la page tldr de `cd`, en forçant la plateforme par défaut : <br><br> `tldr -p {{android\|linux\|osx\|sunos\|windows}} {{cd}}`
| - Print the tldr page for a command for a specific [p]latform: <br><br> `tldr {{command}}` | - Affiche la page tldr d'une sous-commande : <br><br> `tldr {{git-checkout}}`
| - [u]pdate the local cache of tldr pages: <br><br> `tldr -u` | - Met à jour les pages enregistrées localement (si le client supporte la mise en cache) : <br><br> `tldr -u`
