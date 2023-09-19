# Contributing

## Getting Started

Clone the repository with Git.

```sh
git clone https://github.com/tldr-pages/tldr-translation-pairs-gen.git
```

As this is a Node.js project and uses NPM for package management, start by installing dependencies.

```sh
npm i
```

At this stage you should be ready to develop! Feel free to manually execute commands by following the [Manual Execution](#manual-execution) section, just to make sure everything works before diving into the code!

## Testing

Before submitting PRs, execute tests to ensure existing functionality doesn't break. Please introduce new tests for new code.

You can execute tests with:

```sh
npm run test
```

## Manual Execution

You can run this manually over a local copy of tldr-pages. First clone a copy of tldr-pages:

```sh
git clone https://github.com/tldr-pages/tldr.git
```

Then build tldr-translation-pairs-gen:

```sh
npm run build
```

Finally, you can execute the command from the transpiled sources:

```sh
npm run tldr-translation-pairs-gen -- --source {{path/to/tldr_dir}}
```

Read the README or help command for more information on how to use this.

## Backward Compatibility

The GitHub Actions artifacts of this repository are consumed by [OPUS-ingest](https://github.com/Helsinki-NLP/OPUS-ingest). Do not make backward incompatible changes to them.

Changing the file formats, directory structure, and file names **must** be avoided. If it is necessary to alter these, an accompanying pull request **must** be submitted to OPUS-ingest.

See [tldr-pages corpus on OPUS-ingest](https://github.com/Helsinki-NLP/OPUS-ingest/tree/master/corpus/tldr-pages) for more details.
