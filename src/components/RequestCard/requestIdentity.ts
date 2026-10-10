import { normalizeOpenLibraryWorkId } from '@app/utils/apiPath';

type RequestIdentity = {
  media: {
    identifiers?: { provider: string; value: string }[];
    externalServiceSlug?: string | null;
  };
};

export const getBookRequestId = (
  request: RequestIdentity
): string | undefined => {
  const id = request.media.identifiers?.find(
    ({ provider }) => provider === 'openlibrary'
  )?.value;
  return id
    ? normalizeOpenLibraryWorkId(id)
    : request.media.identifiers?.find(
        ({ provider }) => provider === 'bookshelf'
      )?.value;
};

export const getSportsRequestId = (
  request: RequestIdentity
): string | undefined =>
  request.media.identifiers?.find(({ provider }) => provider === 'sportarr')
    ?.value ??
  request.media.externalServiceSlug ??
  undefined;
