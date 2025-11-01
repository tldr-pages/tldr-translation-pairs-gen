import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TldrPage } from '../../src/lib/tldr-page';

describe('TldrPage', () => {

  it('#getFullDescription returns correct string with normal tldr page', () => {
    const tldrPage = new TldrPage(
      'ulimit',
      'Get and set user limits.',
      [
        {
          description: 'Get the properties of all the user limits',
          command: 'ulimit -a'
        },
        {
          description: 'Get hard limit for the number of simultaneously opened files',
          command: 'ulimit -H -n'
        },
        {
          description: 'Get soft limit for the number of simultaneously opened files',
          command: 'ulimit -S -n'
        },
        {
          description: 'Set max per-user process limit',
          command: 'ulimit -u 30'
        }
      ],
      'More information: <https://manned.org/ulimit>.'
    );

    assert.strictEqual(tldrPage.getFullDescription(), 'Get and set user limits.\nMore information: <https://manned.org/ulimit>.');
  });

  it('#getFullDescription returns correct string with normal page with no more info link', () => {
    const tldrPage = new TldrPage(
      'curl',
      'In PowerShell, this command may be an alias of `Invoke-WebRequest` when the original `curl` program (<https://curl.se>) is not properly installed.',
      [
        {
          description: 'Check whether `curl` is properly installed by printing its version number. If this command evaluates into an error, PowerShell may have substituted this command with `Invoke-WebRequest`',
          command: 'curl --version'
        },
        {
          description: 'View documentation for the original `curl` command',
          command: 'tldr curl -p common'
        },
        {
          description: 'View documentation for the original `curl` command in older versions of `tldr` command-line client',
          command: 'tldr curl -o common'
        },
        {
          description: 'View documentation for PowerShell\'s `Invoke-WebRequest` command',
          command: 'tldr invoke-webrequest'
        }
      ]
    );

    assert.strictEqual(tldrPage.description, 'In PowerShell, this command may be an alias of `Invoke-WebRequest` when the original `curl` program (<https://curl.se>) is not properly installed.');
  });

  it('#getFullDescription returns correct string with alias page', () => {
    const tldrPage = new TldrPage(
      'aria2',
      'This command is an alias of `aria2c`.',
      [
        {
          description: 'View documentation for the updated command',
          command: 'tldr aria2c'
        }
      ]
    );

    assert.strictEqual(tldrPage.description, 'This command is an alias of `aria2c`.');
  });
});
