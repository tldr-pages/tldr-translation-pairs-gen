import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TldrFile } from '../../src/lib/tldr-file';

describe('TldrFile', () => {

  it('#isInternationalizedVariant returns true for translated page', () => {
    const enFile = new TldrFile('/pages/common/magick.md', 'en', 'common', 'magick');
    const nlFile = new TldrFile('/pages.nl/common/magick.md', 'nl', 'common', 'magick');

    assert.strictEqual(enFile.isInternationalizedVariant(nlFile), true);
  });

  it('#isInternationalizedVariant returns false for same page', () => {
    const enFile = new TldrFile('/pages/common/magick.md', 'en', 'common', 'magick');

    assert.strictEqual(enFile.isInternationalizedVariant(enFile), false);
  });

  it('#isInternationalizedVariant returns false for different system', () => {
    const enCommonFile = new TldrFile('/pages/common/wget.md', 'en', 'common', 'wget');
    const idWindowsFile = new TldrFile('/pages.id/windows/wget.md', 'id', 'windows', 'wget');

    assert.strictEqual(enCommonFile.isInternationalizedVariant(idWindowsFile), false);
  });

  it('#isInternationalizedVariant returns false for different system', () => {
    const enCommonFile = new TldrFile('/pages/common/wget.md', 'en', 'common', 'wget');
    const enWindowsFile = new TldrFile('/pages/windows/wget.md', 'en', 'windows', 'wget');

    assert.strictEqual(enCommonFile.isInternationalizedVariant(enWindowsFile), false);
  });
});
