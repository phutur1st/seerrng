// Copyright (c) snapetech and SeerrNG contributors.
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  openSync,
  writeFileSync,
} from 'node:fs';

/** Append one record without following links in an evidence-file target. */
export function appendJsonLineNoFollow(file, value, mode = 0o600) {
  const noFollow = constants.O_NOFOLLOW;
  if (!Number.isSafeInteger(noFollow) || noFollow === 0)
    throw new Error('Evidence append requires no-follow file access');

  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
  const descriptor = openSync(
    file,
    constants.O_WRONLY |
      constants.O_APPEND |
      constants.O_CREAT |
      noFollow |
      (constants.O_NONBLOCK ?? 0),
    mode
  );
  try {
    const metadata = fstatSync(descriptor, { bigint: true });
    if (!metadata.isFile() || metadata.nlink !== 1n)
      throw new Error('Evidence append target must be a single-link file');
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}
