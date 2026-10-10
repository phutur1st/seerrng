import { MediaStatus } from '@server/constants/media';
import type Media from '@server/entity/Media';

type BookAvailabilityMedia = Pick<
  Media,
  | 'status'
  | 'serviceId'
  | 'externalServiceId'
  | 'audiobookServiceId'
  | 'audiobookExternalServiceId'
  | 'ebookAvailable'
  | 'audiobookAvailable'
  | 'audiobookLibraryServiceId'
  | 'audiobookLibraryItemId'
>;

export type BookFormat = 'ebook' | 'audiobook' | 'both';

export const hasAvailableBookFormat = (
  media: BookAvailabilityMedia,
  format: Exclude<BookFormat, 'both'>
): boolean => {
  if (media.status !== MediaStatus.AVAILABLE) {
    return false;
  }

  if (format === 'audiobook') {
    return (
      (media.audiobookAvailable === true &&
        media.audiobookServiceId != null &&
        media.audiobookExternalServiceId != null) ||
      (media.audiobookLibraryServiceId !== null &&
        media.audiobookLibraryServiceId !== undefined &&
        media.audiobookLibraryItemId !== null &&
        media.audiobookLibraryItemId !== undefined)
    );
  }

  return (
    media.ebookAvailable === true &&
    media.serviceId != null &&
    media.externalServiceId != null
  );
};

export const isRequestedBookFormatAvailable = (
  media: BookAvailabilityMedia,
  format: BookFormat
): boolean => {
  const ebookAvailable = hasAvailableBookFormat(media, 'ebook');
  const audiobookAvailable = hasAvailableBookFormat(media, 'audiobook');

  if (format === 'both') {
    return ebookAvailable && audiobookAvailable;
  }

  return format === 'audiobook' ? audiobookAvailable : ebookAvailable;
};
