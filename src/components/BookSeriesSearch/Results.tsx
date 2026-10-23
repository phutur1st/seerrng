import CoverCarousel from '@app/components/BookSeriesSearch/CoverCarousel';
import Button from '@app/components/Common/Button';
import { useSearchActivityReporter } from '@app/hooks/useSearchActivity';
import { bookSeriesSearchUrl } from '@app/utils/bookSeriesSearch';
import defineMessages from '@app/utils/defineMessages';
import type { BookSeriesSearchResponse } from '@server/models/BookSeries';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.BookSeriesSearch.Results', {
  ebook: 'Books',
  audiobook: 'Audiobooks',
  library: 'Library subset',
  catalog: 'Series catalog',
  count: '{count, plural, one {# book} other {# books}}',
  formatOnServer: '{format} on {server}',
  libraryFormat: 'Library: {format}',
  empty: 'No matching series found.',
  disabled: 'No book server is configured for this format.',
  unsupported: 'Your book servers do not provide series search.',
  unavailable: 'Series search is unavailable. Please try again.',
  partial:
    'Some book servers or catalogs could not be searched. Available results are shown.',
  truncated:
    'Only part of the catalog could be searched or displayed. Try a more specific name.',
  retry: 'Try Again',
});

export default function BookSeriesSearchResults({
  query,
  format,
  limit = 100,
  sourceFilter,
}: {
  query: string;
  format?: 'ebook' | 'audiobook';
  limit?: number;
  sourceFilter?: 'catalog';
}) {
  const intl = useIntl();
  const url = bookSeriesSearchUrl(query, format);
  const valid = !!url;
  const { data, error, isValidating, mutate } =
    useSWR<BookSeriesSearchResponse>(url, {
      keepPreviousData: false,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 60000,
    });
  useSearchActivityReporter(valid && isValidating, `book-series:${url}`);
  const results = (data?.results ?? []).filter(
    (series) => !sourceFilter || series.source === sourceFilter
  );
  const failed = error || data?.status === 'unavailable';
  return (
    <>
      {failed && (
        <div role="alert" className="page-error-message">
          <p>{intl.formatMessage(messages.unavailable)}</p>
          <Button disabled={isValidating} onClick={() => mutate()}>
            {intl.formatMessage(messages.retry)}
          </Button>
        </div>
      )}
      {data?.status === 'partial' && (
        <div
          role="status"
          className="page-error-message"
          data-severity="warning"
        >
          <p>{intl.formatMessage(messages.partial)}</p>
          <Button disabled={isValidating} onClick={() => mutate()}>
            {intl.formatMessage(messages.retry)}
          </Button>
        </div>
      )}
      {data?.truncated && (
        <p role="status" className="card-body-text">
          {intl.formatMessage(messages.truncated)}
        </p>
      )}
      {data && !results.length && !failed && data.status !== 'partial' && (
        <p className="card-body-text">
          {intl.formatMessage(
            data.status === 'disabled'
              ? messages.disabled
              : data.status === 'unsupported'
                ? messages.unsupported
                : messages.empty
          )}
        </p>
      )}
      <ul className="filter-field-grid">
        {results.slice(0, limit).map((series) => (
          <li
            key={series.key}
            className="app-card-inset refreshed-inset-surface card-stack media-choice-card"
            data-choice-layout="linked"
          >
            <Link
              className="card-title app-detail-link"
              data-card-link="primary"
              href={series.href}
            >
              {series.title}
            </Link>
            <div className="media-fact-row">
              {(series.variants ?? [series])
                .filter(
                  (variant) => !sourceFilter || variant.source === sourceFilter
                )
                .map((variant) => {
                  const formatLabel = intl.formatMessage(
                    variant.format === 'audiobook'
                      ? messages.audiobook
                      : messages.ebook
                  );
                  return (
                    <Link
                      key={variant.key}
                      href={variant.href}
                      className="app-detail-link"
                      data-card-link="secondary"
                      title={intl.formatMessage(messages.formatOnServer, {
                        format: formatLabel,
                        server: variant.serverName,
                      })}
                    >
                      {variant.source === 'library' &&
                      series.source === 'catalog'
                        ? intl.formatMessage(messages.libraryFormat, {
                            format: formatLabel,
                          })
                        : formatLabel}
                    </Link>
                  );
                })}
            </div>
            <p className="card-body-text">
              {intl.formatMessage(
                series.source === 'library'
                  ? messages.library
                  : messages.catalog
              )}
              {series.bookCount !== undefined &&
                ` · ${intl.formatMessage(messages.count, { count: series.bookCount })}`}
            </p>
            <CoverCarousel href={series.href} title={series.title} />
            {series.description && (
              <p className="card-body-text">{series.description}</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
