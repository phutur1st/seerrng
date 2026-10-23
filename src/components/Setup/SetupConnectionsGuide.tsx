import Button from '@app/components/Common/Button';
import defineMessages from '@app/utils/defineMessages';
import {
  ArrowDownTrayIcon,
  BookOpenIcon,
  FilmIcon,
  MusicalNoteIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/solid';
import type { EnabledMediaCategories } from '@server/constants/mediaCategories';
import { MediaServerType } from '@server/constants/server';
import { useIntl, type MessageDescriptor } from 'react-intl';
import type { SetupDownloadProfile } from './setupDownloadClients';
import type { SetupServiceCategory } from './setupServiceCategories';
import { getSetupServiceCategories } from './setupServiceCategories';

const messages = defineMessages('components.Setup', {
  chooseConnectionsTitle: 'What Would You Like to Connect?',
  chooseConnectionsDescription:
    'Choose a section to set up. Each connection is optional, and you can finish now and add services later in Settings.',
  mediaServerTitle: 'Media Server',
  mediaServerConfigured: 'Connected as {name}',
  reviewMediaServer: 'Review',
  movieServicesTitle: 'Movies & TV',
  movieServicesDescription:
    'Connect the apps that handle movie and series requests, such as Radarr and Sonarr.',
  bookServicesTitle: 'Books, Comics & Magazines',
  bookServicesDescription:
    'Connect the services you use for books, audiobooks, comics, and magazines.',
  musicServicesTitle: 'Music',
  musicServicesDescription:
    'Connect a music request service or an existing music library.',
  toolsServicesTitle: 'System Tools',
  toolsServicesDescription:
    'Set up Prowlarr, software services, and other optional tools.',
  downloadsTitle: 'Download Progress',
  downloadsDescription:
    'Choose whether your setup uses Usenet, torrents, or both for live progress.',
  openConnections: 'Choose Services',
  downloadsQuestion: 'How Do Your Downloads Arrive?',
  downloadsQuestionDescription:
    'SeerrNG reads live progress from supported clients. It does not send or manage downloads.',
  usenetTitle: 'Usenet',
  usenetDescription: 'Connect SABnzbd to show live download progress.',
  torrentTitle: 'Torrents',
  torrentDescription:
    'Connect qBittorrent, Transmission, Deluge, rTorrent, or TorrentNG.',
  bothTitle: 'Both',
  bothDescription: 'Add a Usenet client and a torrent client in one pass.',
  configureUsenet: 'Set Up Usenet',
  configureTorrents: 'Set Up Torrents',
  configureBoth: 'Set Up Both',
  backToChoices: 'Back to Choices',
});

const categoryDetails = {
  'tv-movies': {
    title: messages.movieServicesTitle,
    description: messages.movieServicesDescription,
    Icon: FilmIcon,
  },
  'audiobooks-books': {
    title: messages.bookServicesTitle,
    description: messages.bookServicesDescription,
    Icon: BookOpenIcon,
  },
  music: {
    title: messages.musicServicesTitle,
    description: messages.musicServicesDescription,
    Icon: MusicalNoteIcon,
  },
  'tools-other': {
    title: messages.toolsServicesTitle,
    description: messages.toolsServicesDescription,
    Icon: Square3Stack3DIcon,
  },
} satisfies Record<
  SetupServiceCategory,
  {
    title: MessageDescriptor;
    description: MessageDescriptor;
    Icon: typeof FilmIcon;
  }
>;

interface ChoiceCardProps {
  Icon: typeof FilmIcon;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}

const ChoiceCard = ({
  Icon,
  title,
  description,
  action,
  onClick,
}: ChoiceCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="app-card-inset refreshed-inset-surface media-choice-card"
    data-choice-layout="stacked"
  >
    <span className="card-table-icon">
      <Icon aria-hidden="true" className="card-table-icon" />
    </span>
    <span className="card-title">{title}</span>
    <span className="card-body-text">{description}</span>
    <span className="card-body-text">{action}</span>
  </button>
);

interface SetupConnectionsGuideProps {
  view: 'overview' | 'downloads';
  enabledMediaCategories: EnabledMediaCategories;
  mediaServerType: MediaServerType;
  showMediaServer: boolean;
  onOpenMediaServer: () => void;
  onSelectCategory: (category: SetupServiceCategory) => void;
  onOpenDownloads: () => void;
  onSelectDownloadProfile: (profile: SetupDownloadProfile) => void;
  onBack: () => void;
}

const SetupConnectionsGuide = ({
  view,
  enabledMediaCategories,
  mediaServerType,
  showMediaServer,
  onOpenMediaServer,
  onSelectCategory,
  onOpenDownloads,
  onSelectDownloadProfile,
  onBack,
}: SetupConnectionsGuideProps) => {
  const intl = useIntl();
  const visibleCategories = getSetupServiceCategories(enabledMediaCategories);
  const mediaServerName =
    mediaServerType === MediaServerType.PLEX
      ? 'Plex'
      : mediaServerType === MediaServerType.JELLYFIN
        ? 'Jellyfin'
        : mediaServerType === MediaServerType.EMBY
          ? 'Emby'
          : '';

  if (view === 'downloads') {
    return (
      <section aria-labelledby="setup-downloads-title">
        <div className="card-stack">
          <h2 id="setup-downloads-title" className="page-heading">
            {intl.formatMessage(messages.downloadsQuestion)}
          </h2>
          <p className="card-body-text">
            {intl.formatMessage(messages.downloadsQuestionDescription)}
          </p>
        </div>
        <div className="card-list">
          <ChoiceCard
            Icon={ArrowDownTrayIcon}
            title={intl.formatMessage(messages.usenetTitle)}
            description={intl.formatMessage(messages.usenetDescription)}
            action={intl.formatMessage(messages.configureUsenet)}
            onClick={() => onSelectDownloadProfile('usenet')}
          />
          <ChoiceCard
            Icon={ArrowDownTrayIcon}
            title={intl.formatMessage(messages.torrentTitle)}
            description={intl.formatMessage(messages.torrentDescription)}
            action={intl.formatMessage(messages.configureTorrents)}
            onClick={() => onSelectDownloadProfile('torrents')}
          />
          <ChoiceCard
            Icon={ArrowDownTrayIcon}
            title={intl.formatMessage(messages.bothTitle)}
            description={intl.formatMessage(messages.bothDescription)}
            action={intl.formatMessage(messages.configureBoth)}
            onClick={() => onSelectDownloadProfile('both')}
          />
        </div>
        <div className="card-spacing-before">
          <Button buttonType="default" onClick={onBack}>
            {intl.formatMessage(messages.backToChoices)}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="setup-connections-title">
      <div className="card-stack">
        <h2 id="setup-connections-title" className="page-heading">
          {intl.formatMessage(messages.chooseConnectionsTitle)}
        </h2>
        <p className="card-body-text">
          {intl.formatMessage(messages.chooseConnectionsDescription)}
        </p>
      </div>

      {showMediaServer && (
        <div className="app-card-sub refreshed-inset-surface media-fact-row">
          <div>
            <h3 className="card-title">
              {intl.formatMessage(messages.mediaServerTitle)}
            </h3>
            <p className="card-body-text">
              {intl.formatMessage(messages.mediaServerConfigured, {
                name: mediaServerName,
              })}
            </p>
          </div>
          <Button buttonType="default" onClick={onOpenMediaServer}>
            {intl.formatMessage(messages.reviewMediaServer)}
          </Button>
        </div>
      )}

      <div className="filter-field-grid">
        {visibleCategories.map((category) => {
          const detail = categoryDetails[category];

          return (
            <ChoiceCard
              key={category}
              Icon={detail.Icon}
              title={intl.formatMessage(detail.title)}
              description={intl.formatMessage(detail.description)}
              action={intl.formatMessage(messages.openConnections)}
              onClick={() => onSelectCategory(category)}
            />
          );
        })}
        <ChoiceCard
          Icon={ArrowDownTrayIcon}
          title={intl.formatMessage(messages.downloadsTitle)}
          description={intl.formatMessage(messages.downloadsDescription)}
          action={intl.formatMessage(messages.openConnections)}
          onClick={onOpenDownloads}
        />
      </div>
    </section>
  );
};

export default SetupConnectionsGuide;
