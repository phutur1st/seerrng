import http, { type RequestListener, type Server } from 'http';

const DEFAULT_LISTEN_PORT = 5055;
const MAX_LISTEN_PORT = 65_535;

export const HTTP_SERVER_LIMITS = {
  requestTimeoutMs: 60_000,
  headersTimeoutMs: 15_000,
  keepAliveTimeoutMs: 5_000,
  maxHeadersCount: 100,
  maxRequestsPerSocket: 1_000,
} as const;

export const parseListenPort = (
  value?: string,
  variableName = 'PORT',
  defaultValue = DEFAULT_LISTEN_PORT
): number => {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (!/^\d{1,5}$/.test(value)) {
    throw new Error(
      `${variableName} must be a decimal integer between 1 and 65535.`
    );
  }

  const port = Number(value);
  if (port < 1 || port > MAX_LISTEN_PORT) {
    throw new Error(
      `${variableName} must be a decimal integer between 1 and 65535.`
    );
  }

  return port;
};

export const configureHttpServer = <ServerType extends Server>(
  server: ServerType
): ServerType => {
  server.requestTimeout = HTTP_SERVER_LIMITS.requestTimeoutMs;
  server.headersTimeout = HTTP_SERVER_LIMITS.headersTimeoutMs;
  server.keepAliveTimeout = HTTP_SERVER_LIMITS.keepAliveTimeoutMs;
  server.maxHeadersCount = HTTP_SERVER_LIMITS.maxHeadersCount;
  server.maxRequestsPerSocket = HTTP_SERVER_LIMITS.maxRequestsPerSocket;

  return server;
};

export const startLoopbackHttpServer = async (
  requestListener: RequestListener
): Promise<{ server: Server; port: number }> => {
  const server = configureHttpServer(http.createServer(requestListener));

  await new Promise<void>((resolve, reject) => {
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    const onError = (error: Error) => {
      server.off('listening', onListening);
      reject(error);
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(0, '127.0.0.1');
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Internal HTTP listener did not bind to a TCP port.');
  }

  return { server, port: address.port };
};
