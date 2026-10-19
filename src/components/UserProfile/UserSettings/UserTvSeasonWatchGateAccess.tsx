import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import Modal from '@app/components/Common/Modal';
import useToasts from '@app/hooks/useToasts';
import { getPositiveQueryParamNumber } from '@app/hooks/useUpdateQueryParams';
import { useUser } from '@app/hooks/useUser';
import defineMessages from '@app/utils/defineMessages';
import type { TvSeasonWatchGateAccessResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { Permission } from '@server/lib/permissions';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';

const messages = defineMessages(
  'components.UserProfile.UserSettings.UserTvSeasonWatchGateAccess',
  {
    title: 'Previous-Season Watch Requirement',
    description:
      'Choose whether later TV seasons should unlock only after you finish the previous regular season. Specials are skipped.',
    statusGlobal: 'Enabled for everyone',
    statusBypass: 'You can override this rule',
    statusOff: 'Approval needed',
    statusPending: 'Waiting for approval',
    statusApproved: 'Approved · off',
    statusEnabled: 'Enabled for your account',
    statusDenied: 'Request declined',
    globalDescription:
      'The administrator has enabled this rule for everyone. Your later-season requests will follow it while the global setting stays on.',
    managerBypassDescription:
      'Your Administrator or Manage Requests permission lets you bypass this requirement when requesting. It still applies to other users who enable it.',
    offDescription:
      'Ask a user manager to approve this rule for your account. Once approved, you can turn it on. Later-season requests then require playback from your linked media-server account.',
    pendingDescription:
      'Your request is in the user manager’s review queue. You can cancel it while it is pending.',
    approvedDescription:
      'A user manager approved this feature for your account. Turn it on when you want later-season requests to require the previous regular season to be watched.',
    enabledDescription:
      'Every later-season request checks your linked playback history. Link Plex, Jellyfin, or Emby and keep this series synced so SeerrNG can verify what you watched.',
    deniedDescription:
      'A user manager declined this request. You can submit a new request whenever you are ready.',
    requestAccess: 'Request Approval',
    requestAgain: 'Request Approval Again',
    turnOn: 'Turn on for My Account',
    cancelRequest: 'Cancel Request',
    turnOff: 'Turn Off This Rule',
    linkPlayback: 'Link Playback Account',
    modalRequestTitle: 'Request This Rule for Your Account?',
    modalCancelTitle: 'Cancel Your Access Request?',
    modalEnableTitle: 'Turn on the Watch Requirement?',
    modalDisableTitle: 'Turn Off the Watch Requirement?',
    modalRequestDescription:
      'A user manager will review your request. Once approved, you can turn the rule on when you are ready.',
    modalCancelDescription:
      'Your request will be removed from the review queue. You can request access again later.',
    modalEnableDescription:
      'Later-season requests from your account will require you to finish watching the previous regular season. You can turn the rule off again at any time.',
    modalDisableDescription:
      'The watch requirement will stop applying to your account. Your approval stays active, so you can turn the rule on again at any time.',
    saving: 'Saving…',
    requestedAt: 'Requested {date}',
    saved: 'TV request access updated.',
    error: 'Could not update TV request access. Please try again.',
    loadError: 'Could not load TV request access.',
    otherUser: 'Only the account owner can request or disable personal access.',
  }
);

type AccessAction = 'request' | 'cancel' | 'enable' | 'disable';

const UserTvSeasonWatchGateAccess = () => {
  const router = useRouter();
  const intl = useIntl();
  const { addToast } = useToasts();
  const { user: currentUser, hasPermission } = useUser();
  const profileUserId = getPositiveQueryParamNumber(router.query.userId);
  const targetUserId = profileUserId ?? currentUser?.id;
  const isSelf = targetUserId === currentUser?.id;
  const canBypassGate =
    isSelf &&
    hasPermission([Permission.ADMIN, Permission.MANAGE_REQUESTS], {
      type: 'or',
    });
  const {
    data,
    error,
    mutate: refreshAccess,
  } = useSWR<TvSeasonWatchGateAccessResponse>(
    targetUserId
      ? `/api/v1/user/${targetUserId}/settings/tv-season-watch-gate`
      : null,
    { refreshInterval: 60_000 }
  );
  const [pendingAction, setPendingAction] = useState<AccessAction>();
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState(false);

  const status = data?.status ?? 'off';
  const statusLabel = canBypassGate
    ? messages.statusBypass
    : data?.globallyEnabled
      ? messages.statusGlobal
      : status === 'pending'
        ? messages.statusPending
        : status === 'approved'
          ? messages.statusApproved
          : status === 'enabled'
            ? messages.statusEnabled
            : status === 'denied'
              ? messages.statusDenied
              : messages.statusOff;
  const description = canBypassGate
    ? messages.managerBypassDescription
    : data?.globallyEnabled
      ? messages.globalDescription
      : status === 'pending'
        ? messages.pendingDescription
        : status === 'approved'
          ? messages.approvedDescription
          : status === 'enabled'
            ? messages.enabledDescription
            : status === 'denied'
              ? messages.deniedDescription
              : messages.offDescription;
  const actionLabel =
    pendingAction === 'request'
      ? status === 'denied'
        ? messages.requestAgain
        : messages.requestAccess
      : pendingAction === 'cancel'
        ? messages.cancelRequest
        : pendingAction === 'enable'
          ? messages.turnOn
          : messages.turnOff;

  const submitAction = async () => {
    if (!pendingAction || !targetUserId) return;
    setIsSaving(true);
    setActionError(false);
    try {
      const { data: nextAccess } =
        await axios.post<TvSeasonWatchGateAccessResponse>(
          `/api/v1/user/${targetUserId}/settings/tv-season-watch-gate`,
          { action: pendingAction }
        );
      setPendingAction(undefined);
      await refreshAccess(nextAccess);
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

  if (!targetUserId || (!isSelf && !hasPermission(Permission.MANAGE_USERS))) {
    return (
      <Alert type="error" title={intl.formatMessage(messages.otherUser)} />
    );
  }
  if (!data && !error) return <LoadingSpinner />;
  if (!data)
    return (
      <Alert type="error" title={intl.formatMessage(messages.loadError)} />
    );

  const statusBadge = canBypassGate
    ? 'association'
    : data.globallyEnabled || status === 'enabled'
      ? 'success'
      : status === 'pending'
        ? 'warning'
        : status === 'approved'
          ? 'success'
          : status === 'denied'
            ? 'danger'
            : 'default';

  return (
    <div className="card-list">
      {pendingAction && (
        <Modal
          title={intl.formatMessage(
            pendingAction === 'request'
              ? messages.modalRequestTitle
              : pendingAction === 'cancel'
                ? messages.modalCancelTitle
                : pendingAction === 'enable'
                  ? messages.modalEnableTitle
                  : messages.modalDisableTitle
          )}
          onCancel={() => setPendingAction(undefined)}
          onOk={() => void submitAction()}
          okText={
            isSaving
              ? intl.formatMessage(messages.saving)
              : intl.formatMessage(actionLabel)
          }
          okDisabled={isSaving}
          okButtonType={pendingAction === 'disable' ? 'danger' : 'primary'}
        >
          {intl.formatMessage(
            pendingAction === 'request'
              ? messages.modalRequestDescription
              : pendingAction === 'cancel'
                ? messages.modalCancelDescription
                : pendingAction === 'enable'
                  ? messages.modalEnableDescription
                  : messages.modalDisableDescription
          )}
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
              {intl.formatMessage(messages.description)}
            </p>
          </div>
          <Badge badgeType={statusBadge}>
            {intl.formatMessage(statusLabel)}
          </Badge>
        </div>

        <div className="app-card-inset refreshed-inset-surface card-list">
          <p className="card-body-text">{intl.formatMessage(description)}</p>
          {data.requestedAt && status !== 'off' && (
            <p className="card-table-value refreshed-detail-text-muted">
              {intl.formatMessage(messages.requestedAt, {
                date: intl.formatDate(new Date(data.requestedAt), {
                  dateStyle: 'medium',
                }),
              })}
            </p>
          )}
          {isSelf && (
            <div className="app-action-row" data-action-placement="leading">
              <Button
                as="a"
                href="/profile/settings/linked-accounts"
                buttonType="ghost"
                buttonSize="sm"
              >
                {intl.formatMessage(messages.linkPlayback)}
              </Button>
            </div>
          )}
        </div>

        {actionError && (
          <div>
            <Alert type="error" title={intl.formatMessage(messages.error)} />
          </div>
        )}

        {isSelf && !data.globallyEnabled && !canBypassGate && (
          <div className="app-action-row" data-action-placement="leading">
            {(status === 'off' || status === 'denied') && (
              <Button
                buttonType="primary"
                onClick={() => setPendingAction('request')}
              >
                {intl.formatMessage(
                  status === 'denied'
                    ? messages.requestAgain
                    : messages.requestAccess
                )}
              </Button>
            )}
            {status === 'pending' && (
              <Button
                buttonType="ghost"
                onClick={() => setPendingAction('cancel')}
              >
                {intl.formatMessage(messages.cancelRequest)}
              </Button>
            )}
            {status === 'approved' && (
              <Button
                buttonType="primary"
                onClick={() => setPendingAction('enable')}
              >
                {intl.formatMessage(messages.turnOn)}
              </Button>
            )}
            {status === 'enabled' && (
              <Button
                buttonType="danger"
                onClick={() => setPendingAction('disable')}
              >
                {intl.formatMessage(messages.turnOff)}
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserTvSeasonWatchGateAccess;
