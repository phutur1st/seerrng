import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

import { ApiErrorCode } from '@server/constants/error';
import { getSettings } from '@server/lib/settings';
import type { Express } from 'express';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import request from 'supertest';
import authRoutes from './auth';

describe('OIDC initiation through production request validation', () => {
  let app: Express;
  let previousOidcLogin: boolean;

  before(() => {
    previousOidcLogin = getSettings().main.oidcLogin;
    // Reaching the disabled-provider response proves validation admitted the
    // request, without starting a provider flow or changing an account/session.
    getSettings().main.oidcLogin = false;
    app = express();
    app.use(
      OpenApiValidator.middleware({
        apiSpec: path.join(process.cwd(), 'seerr-api.yml'),
        validateRequests: true,
        validateSecurity: false,
      })
    );
    app.use('/api/v1/auth', authRoutes);
    app.use(
      (
        error: { status?: number; message?: string; error?: string },
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        void _next;
        res.status(error.status ?? 500).json({
          message: error.message,
          error: error.error,
        });
      }
    );
  });

  after(() => {
    getSettings().main.oidcLogin = previousOidcLogin;
  });

  for (const callbackPath of ['/login', '/profile/settings/linked-accounts']) {
    it(`admits the client return context with callback ${callbackPath}`, async () => {
      const response = await request(app)
        .get('/api/v1/auth/oidc/login/test')
        .query({
          returnUrl: `https://seerr.example${callbackPath}`,
          returnTo: callbackPath === '/login' ? '/tv/1399?season=2' : '/',
        });
      assert.equal(response.status, 403, JSON.stringify(response.body));
      assert.equal(response.body.error, ApiErrorCode.Unauthorized);
    });
  }

  it('keeps return context optional for older clients', async () => {
    const response = await request(app)
      .get('/api/v1/auth/oidc/login/test')
      .query({ returnUrl: 'https://seerr.example/login' });
    assert.equal(response.status, 403);
    assert.equal(response.body.error, ApiErrorCode.Unauthorized);
  });

  it('still rejects undeclared query parameters', async () => {
    await request(app)
      .get('/api/v1/auth/oidc/login/test')
      .query({ unexpected: 'value' })
      .expect(400);
  });

  it('rejects repeated return context instead of accepting an array', async () => {
    await request(app)
      .get('/api/v1/auth/oidc/login/test?returnTo=%2F&returnTo=%2Frequests')
      .expect(400);
  });

  it('rejects return context beyond the client and handler limit', async () => {
    await request(app)
      .get('/api/v1/auth/oidc/login/test')
      .query({ returnTo: `/${'a'.repeat(2048)}` })
      .expect(400);
  });
});
