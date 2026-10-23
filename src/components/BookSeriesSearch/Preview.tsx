import BookSeriesWatch from '@app/components/BookSeriesWatch';
import Button from '@app/components/Common/Button';
import { PageStatus } from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import BulkRequestModal from '@app/components/RequestModal/BulkRequestModal';
import { Permission, useUser } from '@app/hooks/useUser';
import defineMessages from '@app/utils/defineMessages';
import type { BookSeriesPreview } from '@server/models/BookSeries';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.BookSeriesPreview', {
  title: 'Series Catalog Preview',
  scope:
    'A preview from your book server’s catalog. It may not list every book. Previewing does not request books or enable monitoring.',
  manage: 'Open in {server}',
  hint: 'Choose books and formats to request. Your book server handles monitoring and downloads.',
  request: 'Request Selected Books',
  unmatched: 'No verified book match — requests unavailable',
  ambiguous: 'Conflicting book matches — requests unavailable',
  unresolved: 'Book identity could not be checked — try again',
  truncated:
    'Only the first 100 distinct books were checked for requests. Other entries remain visible.',
  unavailable: 'This series preview could not be loaded.',
  retry: 'Try Again',
  search: 'Search Book Series',
  empty: 'No books were included in this preview.',
  ebook: 'Books',
  audiobook: 'Audiobooks',
});

export default function BookSeriesPreview() {
  const intl = useIntl();
  const router = useRouter();
  const { hasPermission } = useUser();
  const [showRequest, setShowRequest] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  useEffect(() => {
    if (router.isReady) setRouteReady(true);
  }, [router.isReady]);
  const { serverId, scope, providerId } = router.query;
  const params =
    typeof serverId === 'string' &&
    typeof scope === 'string' &&
    typeof providerId === 'string'
      ? new URLSearchParams({ serverId, scope, providerId }).toString()
      : undefined;
  const { data, error, mutate, isValidating } = useSWR<BookSeriesPreview>(
    routeReady && params ? `/api/v1/book-series/catalog?${params}` : null,
    {
      keepPreviousData: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
  const items = useMemo(
    () =>
      (data?.books ?? []).flatMap((entry) => {
        const book = entry.book;
        if (entry.matchStatus !== 'matched' || !book) return [];
        return [
          {
            id: book.id,
            title: entry.title,
            year: book.firstPublishYear,
            image: book.posterPath,
            artist: book.author,
            isbn13: book.isbn13,
            authorId: book.authorId,
            mediaInfo: book.mediaInfo,
          },
        ];
      }),
    [data]
  );
  const pageHeading = (
    <>
      <PageTitle title={data?.title ?? intl.formatMessage(messages.title)} />
      <div className="page-title-row">
        <h1 className="page-title">
          {data?.title ?? intl.formatMessage(messages.title)}
        </h1>
        <PageStatus active={isValidating || watchBusy} />
      </div>
    </>
  );
  if (!routeReady || (params && !data && !error)) return pageHeading;
  if (!data)
    return (
      <div className="card-list">
        {pageHeading}
        <div className="page-error-message">
          <p>{intl.formatMessage(messages.unavailable)}</p>
          <Button onClick={() => mutate()}>
            {intl.formatMessage(messages.retry)}
          </Button>
          <Link href="/book-series">{intl.formatMessage(messages.search)}</Link>
        </div>
      </div>
    );
  return (
    <>
      {pageHeading}
      {showRequest && (
        <BulkRequestModal
          key={params}
          show
          bookSeries
          mediaType="book"
          initialBookFormat={data.format}
          unresolvedBookTitles={data.books
            .filter((b) => b.matchStatus !== 'matched' || !b.book)
            .map((b) => b.title)}
          title={data.title}
          initialItems={items}
          onCancel={() => setShowRequest(false)}
          onComplete={() => mutate()}
        />
      )}
      <p className="card-body-text">{intl.formatMessage(messages.title)}</p>
      <p className="card-body-text">
        {data.serverName} ·{' '}
        {intl.formatMessage(
          data.format === 'audiobook' ? messages.audiobook : messages.ebook
        )}
      </p>
      <p className="card-body-text">{intl.formatMessage(messages.scope)}</p>
      {data.description && <p className="card-body-text">{data.description}</p>}
      <p className="card-body-text">{intl.formatMessage(messages.hint)}</p>
      <div className="media-fact-row">
        {hasPermission([Permission.REQUEST, Permission.REQUEST_BOOK], {
          type: 'or',
        }) && (
          <Button
            buttonType="primary"
            disabled={!items.length}
            onClick={() => setShowRequest(true)}
          >
            {intl.formatMessage(messages.request)}
          </Button>
        )}
        {data.managementUrl && (
          <Button
            as="a"
            href={data.managementUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {intl.formatMessage(messages.manage, { server: data.serverName })}
          </Button>
        )}
        <Link
          className="app-detail-link"
          href={{
            pathname: '/book-series',
            query: { query: data.title, format: data.format },
          }}
        >
          {intl.formatMessage(messages.search)}
        </Link>
      </div>
      {typeof serverId === 'string' &&
        typeof scope === 'string' &&
        typeof providerId === 'string' && (
          <BookSeriesWatch
            key={params}
            onActivityChange={setWatchBusy}
            target={{ serverId: Number(serverId), scope, providerId }}
          />
        )}
      {data.resolutionTruncated && (
        <p role="status" className="card-body-text">
          {intl.formatMessage(messages.truncated)}
        </p>
      )}
      {data.books.some((book) => book.matchStatus === 'unavailable') && (
        <Button onClick={() => mutate()}>
          {intl.formatMessage(messages.retry)}
        </Button>
      )}
      {!data.books.length && <p>{intl.formatMessage(messages.empty)}</p>}
      <ol className="card-list">
        {data.books.map((book, index) => (
          <li
            key={index}
            className="app-card-inset refreshed-inset-surface card-stack"
          >
            <span className="card-table-value">{book.position}</span>
            {book.book ? (
              <Link className="app-detail-link" href={`/book/${book.book.id}`}>
                {book.title}
              </Link>
            ) : (
              <span className="card-title">{book.title}</span>
            )}
            {book.author && (
              <span className="card-table-value">{book.author}</span>
            )}
            {book.matchStatus !== 'matched' && (
              <p className="card-body-text">
                {intl.formatMessage(
                  book.matchStatus === 'ambiguous'
                    ? messages.ambiguous
                    : book.matchStatus === 'unavailable'
                      ? messages.unresolved
                      : messages.unmatched
                )}
              </p>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
