import InlineBookSeriesResults from '@app/components/BookSeriesSearch/InlineResults';
import BookSeriesWatch from '@app/components/BookSeriesWatch';
import Button from '@app/components/Common/Button';
import { PageStatus } from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import BulkRequestModal from '@app/components/RequestModal/BulkRequestModal';
import { Permission, useUser } from '@app/hooks/useUser';
import { encodeApiPathSegment } from '@app/utils/apiPath';
import defineMessages from '@app/utils/defineMessages';
import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import type Media from '@server/entity/Media';
import type { BookSeriesDetails as SeriesDetails } from '@server/models/BookSeries';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.BackendBookSeriesDetails', {
  series: 'Book Series',
  linkedBooks: 'Books in Series',
  search: 'Search Book Series',
  manage: 'Manage Series in {server}',
  request: 'Request Selected Books',
  extras: 'Include companion books and other extras in requests',
  extra: 'Extra',
  source: '{server} · {format}',
  scope:
    'Series membership and reading order from your book server, including books you have not downloaded.',
  unclassified:
    'The server has not classified primary and extra entries for every book.',
  unmatched: 'No verified book match — requests unavailable',
  ambiguous: 'Multiple book matches — requests unavailable',
  unavailable:
    'This series could not be loaded. Check the book server connection or try again later.',
  retry: 'Try Again',
  truncated:
    'This series is too large to show in full. Only the first 500 entries are shown and included in requests.',
  ebook: 'Book',
  audiobook: 'Audiobook',
  managed: 'In library manager',
  pending: 'Requested',
  missing: 'Not requested',
  blocked: 'Blocked',
  position: 'Book {position}',
  noBooks: 'No books have been listed for this series yet.',
  description:
    'Request selected books, or use Monitor Series for ongoing monitoring. Your book server handles searches and downloads.',
});

export default function BookSeriesDetails() {
  const intl = useIntl();
  const router = useRouter();
  const { hasPermission } = useUser();
  const [showRequest, setShowRequest] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);
  const [includeExtras, setIncludeExtras] = useState(false);
  const seriesId =
    typeof router.query.seriesId === 'string'
      ? router.query.seriesId
      : undefined;
  const { data, error, mutate, isValidating } = useSWR<SeriesDetails>(
    seriesId ? `/api/v1/book-series/${encodeApiPathSegment(seriesId)}` : null,
    {
      keepPreviousData: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );
  const items = useMemo(
    () =>
      (data?.entries ?? []).flatMap((entry) => {
        const book = entry.book;
        if (!book || (!includeExtras && entry.primary === false)) return [];
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
    [data, includeExtras]
  );
  const pageHeading = (
    <>
      <PageTitle title={data?.title ?? intl.formatMessage(messages.series)} />
      <div className="page-title-row">
        <h1 className="page-title">
          {data?.title ?? intl.formatMessage(messages.series)}
        </h1>
        <PageStatus active={isValidating || watchBusy} />
      </div>
    </>
  );
  if (!data && !error) return pageHeading;
  if (!data)
    return (
      <div className="card-list">
        {pageHeading}
        <div className="page-error-message">
          <p>{intl.formatMessage(messages.unavailable)}</p>
          <Button onClick={() => mutate()}>
            {intl.formatMessage(messages.retry)}
          </Button>
        </div>
      </div>
    );
  const formatStatus = (
    media: Media | undefined,
    format: 'ebook' | 'audiobook'
  ) => {
    const serviceId =
      format === 'ebook'
        ? media?.externalServiceId
        : media?.audiobookExternalServiceId;
    const requested = media?.requests?.some(
      (request) =>
        ![
          MediaRequestStatus.DECLINED,
          MediaRequestStatus.FAILED,
          MediaRequestStatus.COMPLETED,
        ].includes(request.status) &&
        ((request.bookFormat ?? 'ebook') === format ||
          request.bookFormat === 'both')
    );
    return intl.formatMessage(
      media?.status === MediaStatus.BLOCKLISTED
        ? messages.blocked
        : serviceId != null
          ? messages.managed
          : requested
            ? messages.pending
            : messages.missing
    );
  };
  return (
    <>
      {pageHeading}
      {showRequest && (
        <BulkRequestModal
          show
          bookSeries
          librarySubset
          initialBookFormat={data.format}
          mediaType="book"
          title={data.title}
          initialItems={items}
          onCancel={() => setShowRequest(false)}
          onComplete={() => mutate()}
        />
      )}
      <div className="card-list">
        <p className="card-body-text">{intl.formatMessage(messages.series)}</p>
        <Link
          className="app-detail-link"
          href={{ pathname: '/book-series', query: { format: data.format } }}
        >
          {intl.formatMessage(messages.search)}
        </Link>
        {data.managementUrl && hasPermission(Permission.MANAGE_REQUESTS) && (
          <Button
            as="a"
            href={data.managementUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {intl.formatMessage(messages.manage, { server: data.serverName })}
          </Button>
        )}
        <p className="card-body-text">
          {intl.formatMessage(messages.source, {
            server: data.serverName,
            format: intl.formatMessage(
              data.format === 'audiobook' ? messages.audiobook : messages.ebook
            ),
          })}
        </p>
        <p className="card-body-text">{intl.formatMessage(messages.scope)}</p>
        {data.entries.some((entry) => entry.primary === undefined) && (
          <p className="card-body-text">
            {intl.formatMessage(messages.unclassified)}
          </p>
        )}
        {data.description && (
          <p className="card-body-text">{data.description}</p>
        )}
        <p className="card-body-text">
          {intl.formatMessage(messages.description)}
        </p>
        {data.truncated && (
          <p
            role="status"
            className="page-error-message"
            data-severity="warning"
          >
            {intl.formatMessage(messages.truncated)}
          </p>
        )}
        {hasPermission([Permission.REQUEST, Permission.REQUEST_BOOK], {
          type: 'or',
        }) && (
          <div className="media-fact-row">
            <Button
              buttonType="primary"
              disabled={!items.length}
              onClick={() => setShowRequest(true)}
            >
              {intl.formatMessage(messages.request)}
            </Button>
            <div className="choice-group">
              <label>
                <input
                  type="checkbox"
                  checked={includeExtras}
                  onChange={(event) => setIncludeExtras(event.target.checked)}
                />
                <span>{intl.formatMessage(messages.extras)}</span>
              </label>
            </div>
          </div>
        )}
      </div>
      {data.watchTarget && (
        <BookSeriesWatch
          key={data.id}
          target={data.watchTarget}
          onActivityChange={setWatchBusy}
        />
      )}
      <h2 className="page-heading">
        {intl.formatMessage(messages.linkedBooks)}
      </h2>
      {!data.entries.length && <p>{intl.formatMessage(messages.noBooks)}</p>}
      <ol className="card-list">
        {data.entries.map((entry, index) => (
          <li
            key={`${entry.providerId}:${index}`}
            className="app-card-inset refreshed-inset-surface media-fact-row"
          >
            <div>
              <div className="card-table-value">
                {entry.position !== undefined &&
                  intl.formatMessage(messages.position, {
                    position: entry.position,
                  })}
                {entry.primary === false &&
                  `${entry.position !== undefined ? ' · ' : ''}${intl.formatMessage(messages.extra)}`}
              </div>
              {entry.book ? (
                <Link
                  className="app-detail-link"
                  href={`/book/${encodeApiPathSegment(entry.book.id)}`}
                >
                  {entry.title}
                </Link>
              ) : (
                <span className="card-title">{entry.title}</span>
              )}
            </div>
            {entry.book ? (
              <div className="media-fact-row">
                <span>
                  {intl.formatMessage(messages.ebook)}:{' '}
                  {formatStatus(entry.book.mediaInfo, 'ebook')}
                </span>
                <span>
                  {intl.formatMessage(messages.audiobook)}:{' '}
                  {formatStatus(entry.book.mediaInfo, 'audiobook')}
                </span>
              </div>
            ) : (
              <span className="card-body-text">
                {intl.formatMessage(
                  entry.matchStatus === 'ambiguous'
                    ? messages.ambiguous
                    : messages.unmatched
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="card-spacing-before">
        <InlineBookSeriesResults
          query={data.title}
          format={data.format}
          catalogOnly
        />
      </div>
    </>
  );
}
