import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  INTERNAL_API_HTTP_OPTIONS,
  INTERNAL_API_PORT_ENV,
  encodeInternalApiPathSegment,
  getInternalApiBaseUrl,
} from './internalApi';

const originalHost = process.env.HOST;
const originalPort = process.env.PORT;
const originalInternalApiPort = process.env[INTERNAL_API_PORT_ENV];

afterEach(() => {
  process.env.HOST = originalHost;
  process.env.PORT = originalPort;
  if (originalInternalApiPort === undefined) {
    delete process.env[INTERNAL_API_PORT_ENV];
  } else {
    process.env[INTERNAL_API_PORT_ENV] = originalInternalApiPort;
  }
});

describe('getInternalApiBaseUrl', () => {
  it('uses loopback when HOST is not set', () => {
    delete process.env.HOST;
    delete process.env.PORT;
    delete process.env[INTERNAL_API_PORT_ENV];

    assert.equal(getInternalApiBaseUrl(), 'http://127.0.0.1:5055');
  });

  it('does not use bind-all hosts for internal requests', () => {
    process.env.HOST = '0.0.0.0';
    process.env.PORT = '8080';
    delete process.env[INTERNAL_API_PORT_ENV];

    assert.equal(getInternalApiBaseUrl(), 'http://127.0.0.1:8080');

    process.env.HOST = '::';

    assert.equal(getInternalApiBaseUrl(), 'http://127.0.0.1:8080');
  });

  it('brackets IPv6 hosts', () => {
    process.env.HOST = 'fd00::1';
    process.env.PORT = '8080';
    delete process.env[INTERNAL_API_PORT_ENV];

    assert.equal(getInternalApiBaseUrl(), 'http://[fd00::1]:8080');
  });

  it('rejects host and port values that could change the internal origin', () => {
    process.env.HOST = '127.0.0.1@attacker.example/path';
    process.env.PORT = '5055@attacker.example';
    delete process.env[INTERNAL_API_PORT_ENV];

    assert.equal(getInternalApiBaseUrl(), 'http://127.0.0.1:5055');

    process.env.HOST = 'internal.example:8080';
    process.env.PORT = '70000';
    assert.equal(getInternalApiBaseUrl(), 'http://127.0.0.1:5055');
  });

  it('uses the private listener port when built-in TLS is active', () => {
    process.env.HOST = 'seerr.example';
    process.env.PORT = '5055';
    process.env[INTERNAL_API_PORT_ENV] = '49123';

    assert.equal(getInternalApiBaseUrl(), 'http://127.0.0.1:49123');
  });

  it('ignores an invalid private listener port', () => {
    delete process.env.HOST;
    process.env.PORT = '8080';
    process.env[INTERNAL_API_PORT_ENV] = '70000';

    assert.equal(getInternalApiBaseUrl(), 'http://127.0.0.1:8080');
  });
});

describe('internal API request boundaries', () => {
  it('bounds internal SSR requests', () => {
    assert.equal(INTERNAL_API_HTTP_OPTIONS.timeout, 5_000);
    assert.equal(INTERNAL_API_HTTP_OPTIONS.maxContentLength, 16 * 1024 * 1024);
  });

  it('encodes scalar path parameters and rejects arrays', () => {
    assert.equal(encodeInternalApiPathSegment('../settings'), '..%2Fsettings');
    assert.equal(encodeInternalApiPathSegment(123), '123');
    assert.throws(
      () => encodeInternalApiPathSegment(['123']),
      /must be a scalar/
    );
  });
});
