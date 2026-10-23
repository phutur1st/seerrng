import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import SettingsField from '@app/components/Settings/SettingsField';
import defineMessages from '@app/utils/defineMessages';
import type { MainSettings } from '@server/lib/settings';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';
import {
  buildSetupDefaultsSettings,
  getSetupDefaultsSelection,
  type SetupDefaultsSelection,
} from './setupDefaultsLogic';

const messages = defineMessages('components.Setup', {
  defaultsTitle: 'Set Defaults for New Users',
  defaultsDescription:
    'Choose what people can request when they join. Requests still follow your approval and quota rules.',
  defaultsTip:
    'You can change these defaults or adjust individual users later in Settings.',
  requestAccess: 'Allow New Users to Request Media',
  requestAccessDescription:
    'Give new users access to request items in the categories you enable.',
  enable4k: 'Enable 4K Request Options',
  enable4kDescription:
    'Make 4K requests available throughout SeerrNG. Add separate 4K Radarr or Sonarr destinations under Movies & TV.',
  request4k: 'Allow New Users to Request in 4K',
  request4kDescription:
    'This is a default permission for new users. It needs request access and 4K options enabled.',
  partialRequests: 'Allow Partial TV Season Requests',
  partialRequestsDescription:
    'Let users request selected episodes instead of a full season. This applies to everyone.',
  defaultsLoadError: 'User defaults could not be loaded.',
  defaultsSaveError: 'User defaults could not be saved. Try again.',
  retryDefaults: 'Retry',
  skipDefaults: 'Skip for Now',
  saveDefaults: 'Save Defaults and Continue',
  savingDefaults: 'Saving…',
  backToMediaServer: 'Back',
});

type SetupDefaultsData = Pick<
  MainSettings,
  'defaultPermissions' | 'enable4k' | 'partialRequestsEnabled'
>;

interface SetupDefaultsProps {
  onBack?: () => void;
  onContinue: () => void;
  onSkip: () => void;
}

const SetupDefaults = ({ onBack, onContinue, onSkip }: SetupDefaultsProps) => {
  const intl = useIntl();
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<SetupDefaultsData>('/api/v1/settings/main');
  const [selection, setSelection] = useState<SetupDefaultsSelection>();
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setSelection(getSetupDefaultsSelection(data));
    }
  }, [data]);

  const updateSelection = (value: Partial<SetupDefaultsSelection>) => {
    setSelection((current) => (current ? { ...current, ...value } : current));
    setSaveError(false);
  };

  const saveDefaults = async () => {
    if (!data || !selection || isSaving) return;

    setIsSaving(true);
    setSaveError(false);
    try {
      const next = buildSetupDefaultsSettings(data, selection);
      const response = await axios.post<SetupDefaultsData>(
        '/api/v1/settings/main',
        next
      );
      await mutate('/api/v1/settings/main', response.data, {
        revalidate: false,
      });
      void mutate('/api/v1/settings/public').catch(() => undefined);
      onContinue();
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const renderChoice = ({
    id,
    title,
    description,
    checked,
    disabled = false,
    onChange,
  }: {
    id: string;
    title: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div
      key={id}
      className="app-card-inset refreshed-inset-surface media-choice-card"
    >
      <SettingsField
        type="checkbox"
        id={id}
        name={id}
        label={title}
        aria-describedby={id + '-description'}
        checked={checked}
        disabled={disabled || isSaving}
        onCheckedChange={onChange}
      />
      <div className="card-layout">
        <h3 className="card-title">
          <span>{title}</span>
        </h3>
        <p id={id + '-description'} className="card-body-text">
          {description}
        </p>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="setup-defaults-title">
      <div className="card-stack">
        <h2 id="setup-defaults-title" className="page-heading">
          {intl.formatMessage(messages.defaultsTitle)}
        </h2>
        <p className="card-body-text">
          {intl.formatMessage(messages.defaultsDescription)}
        </p>
        <p className="card-body-text">
          {intl.formatMessage(messages.defaultsTip)}
        </p>
      </div>

      {error && !data && (
        <Alert
          type="error"
          title={intl.formatMessage(messages.defaultsLoadError)}
        >
          <Button
            buttonType="default"
            buttonSize="sm"
            onClick={() => void revalidate()}
          >
            {intl.formatMessage(messages.retryDefaults)}
          </Button>
        </Alert>
      )}
      {saveError && (
        <Alert
          type="error"
          title={intl.formatMessage(messages.defaultsSaveError)}
        />
      )}
      {!data && !error && <LoadingSpinner />}
      {data && selection && (
        <div className="filter-field-grid">
          {renderChoice({
            id: 'setup-default-request-access',
            title: intl.formatMessage(messages.requestAccess),
            description: intl.formatMessage(messages.requestAccessDescription),
            checked: selection.allowRequests,
            onChange: (allowRequests) =>
              updateSelection({
                allowRequests,
                allow4kRequests: allowRequests
                  ? selection.allow4kRequests
                  : false,
              }),
          })}
          {renderChoice({
            id: 'setup-default-enable-4k',
            title: intl.formatMessage(messages.enable4k),
            description: intl.formatMessage(messages.enable4kDescription),
            checked: selection.enable4k,
            onChange: (enable4k) =>
              updateSelection({
                enable4k,
                allow4kRequests: enable4k ? selection.allow4kRequests : false,
              }),
          })}
          {renderChoice({
            id: 'setup-default-request-4k',
            title: intl.formatMessage(messages.request4k),
            description: intl.formatMessage(messages.request4kDescription),
            checked: selection.allow4kRequests,
            disabled: !selection.allowRequests || !selection.enable4k,
            onChange: (allow4kRequests) => updateSelection({ allow4kRequests }),
          })}
          {renderChoice({
            id: 'setup-default-partial-requests',
            title: intl.formatMessage(messages.partialRequests),
            description: intl.formatMessage(
              messages.partialRequestsDescription
            ),
            checked: selection.partialRequestsEnabled,
            onChange: (partialRequestsEnabled) =>
              updateSelection({ partialRequestsEnabled }),
          })}
        </div>
      )}

      <div className="media-primary-action-row">
        <div>
          {onBack && (
            <Button buttonType="default" onClick={onBack} disabled={isSaving}>
              {intl.formatMessage(messages.backToMediaServer)}
            </Button>
          )}
        </div>
        <div className="media-fact-row">
          <Button buttonType="default" onClick={onSkip} disabled={isSaving}>
            {intl.formatMessage(messages.skipDefaults)}
          </Button>
          <Button
            buttonType="primary"
            onClick={() => void saveDefaults()}
            disabled={!data || !selection || isSaving}
          >
            {intl.formatMessage(
              isSaving ? messages.savingDefaults : messages.saveDefaults
            )}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SetupDefaults;
