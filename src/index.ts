import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { execute } from './lib/lib';
import { VERSION } from './constants';

const program = new Command('tldr-translation-pairs-gen');

program
  .name('tldr-translation-pairs-gen')
  .addHelpText('before', `Version: ${VERSION}`)
  .addHelpText('before', 'Copyright (c) 2022-present tldr-pages team and contributors')
  .description(`Generates a translation dataset derived from tldr-pages with support for various formats`)
  .requiredOption('-s, --source <dir>', 'path to tldr-pages directory (required)')
  .option('-f, --format <format>', 'output format, can be tmx, xml, csv, or json', 'tmx')
  .option('-o, --output <dir>', 'directory to output files', 'datasets')
  .option('-O, --overwrite', 'overwrite files if they already exist', false)
  .option('-v, --verbose', 'verbose output during execution', false)
  .version(VERSION);

program.parse();

const options = program.opts();
const { source, format, output, overwrite } = options;

async function process() {
  const absOutputPath = path.resolve(output);
  const outputDirExists = fs.existsSync(output);

  if (outputDirExists) {
    if (!overwrite) {
      console.error(`ERROR: Directory (${output}) already exists. Change the output location with --output, or overwrite the existing file with --overwrite!`);
      return;
    }

    console.info(`Deleting contents of ${output} before proceeding. (${absOutputPath})`);

    fs.readdir(absOutputPath, (err, files) => {
      if (err) {
        throw err;
      }

      for (const file of files) {
        fs.unlink(path.join(absOutputPath, file), () => undefined);
      }
    });
  } else {
    fs.mkdir(absOutputPath, () => undefined);
  }

  try {
    await execute(source, absOutputPath, format);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`ERROR: ${error.message}`);
      return;
    }

    throw error;
  }
}

process();
