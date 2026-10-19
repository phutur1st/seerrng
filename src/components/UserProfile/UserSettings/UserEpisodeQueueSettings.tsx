import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import Modal from '@app/components/Common/Modal';
import useToasts from '@app/hooks/useToasts';
import { getPositiveQueryParamNumber } from '@app/hooks/useUpdateQueryParams';
import { Permission, useUser } from '@app/hooks/useUser';
import defineMessages from '@app/utils/defineMessages';
import type { EpisodeQueueAccessResponse } from '@server/interfaces/api/userSettingsInterfaces';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';

const messages = defineMessages(
  'components.UserProfile.UserSettings.UserEpisodeQueueSettings',
  {
    title: 'Episode Queue',
    adminDescription:
      'Set one default for all of this user’s interactive TV requests. It updates existing and future requests that follow the user default.',
    statusOn: 'Enabled by admin',
    statusOff: 'Off for this user',
    defaultLabel: 'Episodes to Keep Requested',
    defaultHelp:
      'This applies to all existing and future interactive TV requests for this user. Each request starts with one episode, then playback keeps the selected number of upcoming episodes requested.',
    off: 'Off',
    episodeOption: '{count, plural, one {# episode} other {# episodes}}',
    save: 'Save Default',
    saving: 'Saving…',
    saved: 'Episode Queue default saved.',
    error: 'Could not update this user’s Episode Queue default. Try again.',
    loadError: 'Could not load Episode Queue settings.',
    retry: 'Retry',
    noPermission: 'Only a user manager can manage Episode Queue settings.',
    managedByAdmin:
      'Episode Queue is managed by your server administrator from each user’s profile.',
    modalTitle: 'Apply This Episode Queue Default?',
    modalOn:
      'This will keep {count} queued ahead on all of this user’s existing and future interactive TV requests. Episodes already requested will stay in place.',
    modalOff:
      'This will stop future Episode Queue additions across this user’s interactive TV requests. Episodes already requested will remain in SeerrNG and Sonarr.',
  }
);

const UserEpisodeQueueSettings = () => {
  const router = useRouter();
  const intl = useIntl();
  const { addToast } = useToasts();
  const { user: currentUser, hasPermission } = useUser();
  const profileUserId = getPositiveQueryParamNumber(router.query.userId);
  const targetUserId = profileUserId ?? currentUser?.id;
  const canManageUsers = hasPermission(Permission.MANAGE_USERS);
  const {
    data,
    error: loadError,
    mutate: refreshAccess,
  } = useSWR<EpisodeQueueAccessResponse>(
    canManageUsers && targetUserId
      ? `/api/v1/user/${targetUserId}/settings/episode-queue`
      : null
  );
  const [defaultCount, setDefaultCount] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState(false);

  useEffect(() => {
    setDefaultCount(data?.defaultEpisodeCount ?? 0);
  }, [data?.defaultEpisodeCount]);

  const saveDefault = async () => {
    if (!targetUserId) return;
    setIsSaving(true);
    setActionError(false);
    try {
      const { data: nextAccess } = await axios.post<EpisodeQueueAccessResponse>(
        `/api/v1/user/${targetUserId}/settings/episode-queue`,
        { defaultEpisodeCount: defaultCount }
      );
      setShowConfirm(false);
      await refreshAccess(nextAccess);
      await mutate(`/api/v1/user/${targetUserId}`);
      await mutate('/api/v1/auth/me');
      addToast(intl.formatMessage(messages.saved), {
        appearance: 'success',
        autoDismiss: true,
      });
    } catch {
      setActionError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManageUsers) {
    return (
      <Alert type="info" title={intl.formatMessage(messages.managedByAdmin)} />
    );
  }
  if (!targetUserId) {
    return (
      <Alert type="error" title={intl.formatMessage(messages.noPermission)} />
    );
  }
  if (!data && !loadError) return <LoadingSpinner />;
  if (!data) {
    return (
      <div className="card-list">
        <Alert type="error" title={intl.formatMessage(messages.loadError)} />
        <Button buttonType="ghost" onClick={() => void refreshAccess()}>
          {intl.formatMessage(messages.retry)}
        </Button>
      </div>
    );
  }

  const isEnabled = data.defaultEpisodeCount > 0;
  const statusBadge = isEnabled ? 'success' : 'default';
  return (
    <div className="card-list">
      {showConfirm && (
        <Modal
          title={intl.formatMessage(messages.modalTitle)}
          onCancel={() => setShowConfirm(false)}
          onOk={() => void saveDefault()}
          okText={intl.formatMessage(
            isSaving ? messages.saving : messages.save
          )}
          okDisabled={isSaving}
        >
          {defaultCount > 0
            ? intl.formatMessage(messages.modalOn, {
                count: intl.formatMessage(messages.episodeOption, {
                  count: defaultCount,
                }),
              })
            : intl.formatMessage(messages.modalOff)}
        </Modal>
      )}
      <section className="app-card-main refreshed-card-surface card-list">
        <div
          className="app-action-row"
          data-action-placement="distributed"
          data-action-layout="summary"
        >
          <div className="card-layout" data-card-layout="copy">
            <h2 className="card-title">{intl.formatMessage(messages.title)}</h2>
            <p className="card-body-text">
              {intl.formatMessage(messages.adminDescription)}
            </p>
          </div>
          <Badge badgeType={statusBadge}>
            {intl.formatMessage(
              isEnabled ? messages.statusOn : messages.statusOff
            )}
          </Badge>
        </div>

        <div className="app-card-inset refreshed-inset-surface card-list">
          <label
            htmlFor="episode-queue-default-count"
            className="card-table-heading"
          >
            {intl.formatMessage(messages.defaultLabel)}
          </label>
          <select
            id="episode-queue-default-count"
            className="request-form-control"
            data-control-size="compact"
            value={defaultCount}
            onChange={(event) => setDefaultCount(Number(event.target.value))}
            disabled={isSaving}
          >
            <option value={0}>{intl.formatMessage(messages.off)}</option>
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {intl.formatMessage(messages.episodeOption, { count })}
              </option>
            ))}
          </select>
          <p className="card-body-text">
            {intl.formatMessage(messages.defaultHelp)}
          </p>
          <div className="app-action-row" data-action-placement="leading">
            <Button
              buttonType="primary"
              disabled={isSaving || defaultCount === data.defaultEpisodeCount}
              onClick={() => setShowConfirm(true)}
            >
              {intl.formatMessage(messages.save)}
            </Button>
          </div>
        </div>

        {(actionError || loadError) && (
          <div>
            <Alert type="error" title={intl.formatMessage(messages.error)} />
          </div>
        )}
      </section>
    </div>
  );
};

export default UserEpisodeQueueSettings;
