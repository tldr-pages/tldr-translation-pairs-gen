import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { execute } from './lib/lib';

const version = '0.1.0';

const program = new Command('tldr-translation-dataset-gen');

program
  .name('tldr-translation-dataset-get')
  .addHelpText('before', `Version: ${version}`)
  .addHelpText('before', 'Copyright (c) 2022-present tldr-pages team and contributors')
  .description(`Generates a translation dataset derived from tldr-pages with support for various formats`)
  .requiredOption('-s, --source <dir>', 'path to tldr-pages directory (required)')
  .option('-f, --format <format>', 'output format, can be xml, csv, or json')
  .option('-l, --language <iso>', 'source langauge to map translations from', 'en')
  .option('-o, --output <file>', 'location to output dataset')
  .option('-O, --overwrite', 'overwrite files if they already exist', false)
  .option('-v, --verbose', 'verbose output during execution', false)
  .version(version);

program.parse();

const options = program.opts();
const { source, format, language, output, overwrite } = options;

let effectiveOutput: string = output;
let targetFormat: string = format;

if (output && !format) {
  targetFormat = path.extname(output).substring(1) || 'xml';
} else if (!output && format) {
  effectiveOutput = `dataset.${format}`;
} else if (!output && !format) {
  targetFormat = 'xml';
  effectiveOutput = `dataset.${targetFormat}`;
}

async function process() {
  const absOutputPath = path.resolve(effectiveOutput);
  const outputExists = fs.existsSync(effectiveOutput);

  if (outputExists) {
    if (!overwrite) {
      console.error(`ERROR: File (${effectiveOutput}) already exists. Change the output location with --output, or overwrite the existing file with --overwrite!`);
      return;
    }

    console.info(`Deleting ${effectiveOutput} before proceeding. (${absOutputPath})`);
    fs.unlink(absOutputPath, () => undefined);
  }

  try {
    await execute(source, language, absOutputPath, targetFormat);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`ERROR: ${error.message}`);
      return;
    }

    throw error;
  }
}

process();
