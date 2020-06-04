import { localized, localizedReactFragment, React } from 'mailspring-exports';

const AccountProviders = [
  {
    provider: 'gmail',
    displayName: 'Gmail or G Suite',
    icon: 'ic-settings-account-gmail.png',
    headerIcon: 'setup-icon-provider-gmail.png',
    color: '#e99999',
  },
  {
    provider: 'imap',
    displayName: 'IMAP / SMTP',
    displayNameShort: 'IMAP',
    icon: 'ic-settings-account-imap.png',
    headerIcon: 'setup-icon-provider-imap.png',
    color: '#aaa',
  },
];

export default AccountProviders;
