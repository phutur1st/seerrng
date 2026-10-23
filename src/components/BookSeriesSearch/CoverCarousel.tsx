import defineMessages from '@app/utils/defineMessages';
import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { BookSeriesCovers } from '@server/models/BookSeries';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.BookSeriesSearch.CoverCarousel', {
  covers: 'Book covers in {series}',
  previous: 'Previous Book Covers',
  next: 'Next Book Covers',
  open: 'Open {series}: {book}',
});

function Cover({ book }: { book: BookSeriesCovers['books'][number] }) {
  const [failed, setFailed] = useState(false);
  return book.coverUrl && !failed ? (
    <Image
      src={book.coverUrl}
      alt={book.title}
      width={72}
      height={108}
      unoptimized
      loading="lazy"
      className="cover-thumb"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className="cover-thumb"
      data-cover-state="missing"
      role="img"
      aria-label={book.title}
    >
      <BookOpenIcon className="card-table-icon" aria-hidden="true" />
    </div>
  );
}

export default function CoverCarousel({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  const intl = useIntl();
  const container = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const [visible, setVisible] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: true });
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const target = new URL(href, 'http://series.local');
  const native = /^\/book-series\/([1-9]\d*)$/.exec(target.pathname);
  const query = native
    ? `seriesId=${native[1]}`
    : target.searchParams.toString();
  const { data } = useSWR<BookSeriesCovers>(
    visible ? `/api/v1/book-series/covers?${query}` : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 300000,
    }
  );
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const update = () =>
      setEdges({
        start: node.scrollLeft <= 1,
        end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1,
      });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    node.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      node.removeEventListener('scroll', update);
    };
  }, [data]);
  const scroll = (direction: number) => {
    const node = track.current;
    if (node)
      node.scrollBy({
        left: direction * Math.max(80, node.clientWidth * 0.8),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
  };
  return (
    <div ref={container} className="card-stack" data-card-link="secondary">
      {!!data?.books.length && (
        <div
          className="card-stack"
          role="group"
          aria-roledescription="carousel"
          aria-label={intl.formatMessage(messages.covers, { series: title })}
        >
          <div className="media-fact-row">
            <button
              type="button"
              disabled={edges.start}
              onClick={() => scroll(-1)}
              aria-label={intl.formatMessage(messages.previous)}
              className="app-button app-button-success button-standard"
            >
              <ChevronLeftIcon aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={edges.end}
              onClick={() => scroll(1)}
              aria-label={intl.formatMessage(messages.next)}
              className="app-button app-button-success button-standard"
            >
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <ul
            ref={track}
            tabIndex={0}
            aria-label={intl.formatMessage(messages.covers, { series: title })}
            className="card-list"
            data-list-layout="covers"
          >
            {data.books.map((book, index) => (
              <li
                key={`${index}:${book.coverUrl ?? book.title}`}
                data-list-part="cover"
              >
                <Link
                  href={href}
                  title={book.title}
                  aria-label={intl.formatMessage(messages.open, {
                    series: title,
                    book: book.title,
                  })}
                  className="app-detail-link"
                >
                  <Cover book={book} />
                  <span className="card-table-value" data-cover-part="title">
                    {book.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
