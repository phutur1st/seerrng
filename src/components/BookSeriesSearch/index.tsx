import Button from '@app/components/Common/Button';
import { PageStatus } from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import defineMessages from '@app/utils/defineMessages';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import BookSeriesSearchResults from './Results';

const messages = defineMessages('components.BookSeriesSearch', {
  title: 'Search Book Series',
  query: 'Series Name',
  search: 'Search',
  format: 'Format',
  all: 'All Formats',
  ebook: 'Books',
  audiobook: 'Audiobooks',
  hint: 'Find series by name in your book library and supported catalogs.',
  media: 'Back to Media Search',
});

export default function BookSeriesSearch() {
  const intl = useIntl();
  const router = useRouter();
  const query =
    typeof router.query.query === 'string' ? router.query.query.trim() : '';
  const format =
    router.query.format === 'ebook' || router.query.format === 'audiobook'
      ? router.query.format
      : '';
  const [input, setInput] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [routeReady, setRouteReady] = useState(false);
  useEffect(() => {
    if (!router.isReady) return;
    setRouteReady(true);
    setInput(query);
    setInputFormat(format);
  }, [format, query, router.isReady]);
  return (
    <>
      <PageTitle title={intl.formatMessage(messages.title)} />
      <div className="page-title-row">
        <h1 className="page-title">{intl.formatMessage(messages.title)}</h1>
        <PageStatus />
      </div>
      <p className="card-body-text">{intl.formatMessage(messages.hint)}</p>
      <form
        className="media-fact-row"
        onSubmit={(event) => {
          event.preventDefault();
          void router.push({
            pathname: '/book-series',
            query: {
              query: input.trim(),
              ...(inputFormat ? { format: inputFormat } : {}),
            },
          });
        }}
      >
        <div className="card-list">
          <label htmlFor="series-query">
            {intl.formatMessage(messages.query)}
          </label>
          <input
            id="series-query"
            className="request-form-control"
            data-control-size="compact"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            minLength={2}
            maxLength={200}
            required
          />
        </div>
        <div className="card-list">
          <label htmlFor="series-format">
            {intl.formatMessage(messages.format)}
          </label>
          <select
            id="series-format"
            className="request-form-control"
            data-control-size="compact"
            value={inputFormat}
            onChange={(e) => setInputFormat(e.target.value)}
          >
            <option value="">{intl.formatMessage(messages.all)}</option>
            <option value="ebook">{intl.formatMessage(messages.ebook)}</option>
            <option value="audiobook">
              {intl.formatMessage(messages.audiobook)}
            </option>
          </select>
        </div>
        <Button
          buttonType="primary"
          type="submit"
          disabled={input.trim().length < 2}
        >
          {intl.formatMessage(messages.search)}
        </Button>
      </form>
      <Link
        className="app-detail-link"
        href={{ pathname: '/search', query: { query } }}
      >
        {intl.formatMessage(messages.media)}
      </Link>
      {routeReady && (
        <BookSeriesSearchResults query={query} format={format || undefined} />
      )}
    </>
  );
}
