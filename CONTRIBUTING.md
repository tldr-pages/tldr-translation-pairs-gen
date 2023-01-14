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

At this stage you should be ready to develop! Feel free to try and manually execute commands by following the [Manual Execution](#manual-execution) section just to make sure everything works before diving into the code!

## Testing

Before submitting PRs, execute tests to ensure existing functionality doesn't break. Please introduce new tests for new code.

You can execute tests with the following command:

```sh
npm run test
```

## Manual Execution

You can run this manually over a local copy of tldr-pages. First clone a copy of tldr-pages somewhere on your device.

```sh
git clone https://github.com/tldr-pages/tldr.git
```

Then build tldr-translation-pairs-gen:

```sh
npm run build
```

Finally, you can execute the command from the transpiled sources.

```sh
npm run tldr-translation-pairs-gen -- -s {PATH_TO_TLDR-PAGES} -o dataset.csv -O
```

Read the README or help command for more information on how to use this and arguments.
