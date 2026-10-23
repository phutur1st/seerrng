import Button from '@app/components/Common/Button';
import { PageStatus } from '@app/components/Common/LoadingSpinner';
import { Permission, useUser } from '@app/hooks/useUser';
import defineMessages from '@app/utils/defineMessages';
import type {
  BookSeriesWatchStatus,
  BookSeriesWatchTarget,
} from '@server/models/BookSeries';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.BookSeriesWatch', {
  monitor: 'Monitor Series',
  description:
    'Request ongoing monitoring for this series and format. Chaptarr adds current and future catalog books and handles searches and download timing.',
  approval:
    'Requests follow book approval permissions. A manager must approve watches for users with book quotas or service overrides. Future books are handled by Chaptarr and are not individual SeerrNG requests.',
  extras: 'Include companion books and other extras',
  goodreads:
    'This Goodreads catalog includes all linked books; primary books are not classified.',
  submit: 'Request Monitoring',
  active: 'Chaptarr series watch is enabled.',
  pending: 'Series monitoring is awaiting approval.',
  failed:
    'Chaptarr has not confirmed this watch. A request manager can retry from Series Monitoring Requests.',
  stopped:
    'This watch is disabled in Chaptarr. A request manager can resume it from Series Monitoring Requests.',
  lastConfirmed: 'Last confirmed status',
  empty: 'No series monitoring requests yet.',
  primaryOnly: 'Primary catalog books only',
  includesExtras: 'Includes companion books and extras',
  destination: 'Destination: {destination}',
  serverChanged:
    'Book server configuration changed; this request cannot be dispatched.',
  unavailable: 'Series monitoring could not be checked. Try again.',
  unsupported:
    'This book server version does not support ongoing series monitoring.',
  retry: 'Try Again',
  requests: 'Series Monitoring Requests',
  approve: 'Approve / Retry',
  decline: 'Decline',
  stop: 'Stop Watching',
  stopHint:
    'Stopping a watch ends future discovery. Books already monitored or downloaded remain in Chaptarr.',
  cancel: 'Cancel',
});
export default function BookSeriesWatch({
  target,
  onActivityChange,
}: {
  target: BookSeriesWatchTarget;
  onActivityChange?: (active: boolean) => void;
}) {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [includeExtras, setIncludeExtras] = useState(
    target.providerId.startsWith('gr:')
  );
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const params = new URLSearchParams({
    ...target,
    serverId: String(target.serverId),
  });
  const { data, error, mutate, isValidating } = useSWR<BookSeriesWatchStatus>(
    `/api/v1/book-series/watch?${params}`,
    { shouldRetryOnError: false }
  );
  useEffect(() => {
    onActivityChange?.(busy || isValidating);
    return () => onActivityChange?.(false);
  }, [busy, isValidating, onActivityChange]);
  const submit = async () => {
    setBusy(true);
    setFailure(undefined);
    try {
      await axios.post('/api/v1/book-series/watch', {
        ...target,
        includeExtras,
      });
      await mutate();
      setExpanded(false);
    } catch (error) {
      setFailure(
        axios.isAxiosError(error)
          ? (error.response?.data?.message ??
              intl.formatMessage(messages.unavailable))
          : intl.formatMessage(messages.unavailable)
      );
      await mutate();
    } finally {
      setBusy(false);
    }
  };
  if (!data && !error) return null;
  if (error)
    return (
      <div className="page-error-message">
        <p>{intl.formatMessage(messages.unavailable)}</p>
        <Button onClick={() => mutate()}>
          {intl.formatMessage(messages.retry)}
        </Button>
      </div>
    );
  if (!data?.supported)
    return (
      <p className="card-body-text">
        {intl.formatMessage(messages.unsupported)}
      </p>
    );
  return (
    <section className="app-card-sub refreshed-inset-surface card-stack">
      <h2 className="page-heading">{intl.formatMessage(messages.monitor)}</h2>
      <p className="card-body-text">
        {intl.formatMessage(messages.description)}
      </p>
      {failure && (
        <p role="alert" className="page-error-message">
          {failure}
        </p>
      )}
      {data.enabled ? (
        <p role="status">{intl.formatMessage(messages.active)}</p>
      ) : data.request?.status === 'pending' ? (
        <p role="status">{intl.formatMessage(messages.pending)}</p>
      ) : data.request?.status === 'active' ? (
        <p role="status">{intl.formatMessage(messages.stopped)}</p>
      ) : data.request?.status === 'failed' ? (
        <p role="status">{intl.formatMessage(messages.failed)}</p>
      ) : (
        hasPermission([Permission.REQUEST, Permission.REQUEST_BOOK], {
          type: 'or',
        }) && (
          <>
            {!expanded ? (
              <Button buttonType="primary" onClick={() => setExpanded(true)}>
                {intl.formatMessage(messages.monitor)}
              </Button>
            ) : (
              <>
                <p className="card-body-text">
                  {intl.formatMessage(messages.approval)}
                </p>
                {target.providerId.startsWith('gr:') ? (
                  <p>{intl.formatMessage(messages.goodreads)}</p>
                ) : (
                  <label className="media-fact-row">
                    <input
                      type="checkbox"
                      checked={includeExtras}
                      onChange={(event) =>
                        setIncludeExtras(event.target.checked)
                      }
                    />
                    {intl.formatMessage(messages.extras)}
                  </label>
                )}
                <div className="media-fact-row">
                  <Button buttonType="primary" disabled={busy} onClick={submit}>
                    {intl.formatMessage(messages.submit)}
                  </Button>
                  <Button disabled={busy} onClick={() => setExpanded(false)}>
                    {intl.formatMessage(messages.cancel)}
                  </Button>
                </div>
              </>
            )}
          </>
        )
      )}
      <Link href="/book-series/requests" className="app-detail-link">
        {intl.formatMessage(messages.requests)}
      </Link>
    </section>
  );
}

export function SeriesWatchRequests() {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const { data, error, mutate } = useSWR<
    (NonNullable<BookSeriesWatchStatus['request']> & {
      target: BookSeriesWatchTarget;
      serverName?: string;
      destination?: string;
    })[]
  >('/api/v1/book-series/watch/requests');
  const act = async (id: number, action: string) => {
    setBusy(true);
    setFailure(undefined);
    try {
      await axios.post(`/api/v1/book-series/watch/requests/${id}/${action}`);
    } catch (error) {
      setFailure(
        axios.isAxiosError(error)
          ? (error.response?.data?.message ??
              intl.formatMessage(messages.unavailable))
          : intl.formatMessage(messages.unavailable)
      );
    } finally {
      await mutate();
      setBusy(false);
    }
  };
  return (
    <div className="card-list">
      <div className="page-title-row">
        <h1 className="page-title">{intl.formatMessage(messages.requests)}</h1>
        <PageStatus active={busy || (!data && !error)} />
      </div>
      <p className="card-body-text">
        {intl.formatMessage(messages.description)}
      </p>
      <p className="card-body-text">{intl.formatMessage(messages.stopHint)}</p>
      {(failure || error) && (
        <p role="alert" className="page-error-message">
          {failure ?? intl.formatMessage(messages.unavailable)}
        </p>
      )}
      {data?.length === 0 && <p>{intl.formatMessage(messages.empty)}</p>}
      {data?.map((row) => (
        <div
          key={row.id}
          className="app-card-sub refreshed-inset-surface card-stack"
        >
          <p className="card-title">
            <Link
              className="app-detail-link"
              href={
                row.target.providerId.startsWith('hc:')
                  ? {
                      pathname: '/book-series/catalog',
                      query: { ...row.target },
                    }
                  : {
                      pathname: '/book-series',
                      query: { query: row.title, format: row.format },
                    }
              }
            >
              {row.title}
            </Link>{' '}
            · {row.serverName} · {row.format}
          </p>
          <p>
            {intl.formatMessage(
              row.includeExtras ? messages.includesExtras : messages.primaryOnly
            )}
          </p>
          {hasPermission(Permission.MANAGE_REQUESTS) && (
            <p>
              {row.destination
                ? intl.formatMessage(messages.destination, {
                    destination: row.destination,
                  })
                : intl.formatMessage(messages.serverChanged)}
            </p>
          )}
          <p>
            {intl.formatMessage(messages.lastConfirmed)}: {row.status}
          </p>
          {hasPermission(Permission.MANAGE_REQUESTS) && (
            <div className="media-fact-row">
              {['pending', 'failed', 'stopped', 'declined', 'active'].includes(
                row.status
              ) && (
                <Button disabled={busy} onClick={() => act(row.id, 'approve')}>
                  {intl.formatMessage(messages.approve)}
                </Button>
              )}
              {row.status === 'pending' && (
                <Button disabled={busy} onClick={() => act(row.id, 'decline')}>
                  {intl.formatMessage(messages.decline)}
                </Button>
              )}
              {['active', 'failed'].includes(row.status) && (
                <Button disabled={busy} onClick={() => act(row.id, 'stop')}>
                  {intl.formatMessage(messages.stop)}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
