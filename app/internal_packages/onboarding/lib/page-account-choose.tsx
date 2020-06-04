import React from 'react';
import { localized, Account, RegExpUtils } from 'mailspring-exports';
import * as OnboardingActions from './onboarding-actions';
import { expandAccountWithCommonSettings } from './onboarding-helpers';
import CreatePageForForm from './decorators/create-page-for-form';
import FormField from './form-field';

interface AccountBasicSettingsFormProps {
  account: Account;
  errorFieldNames: string[];
  submitting: boolean;
  onConnect: (account: Account) => void;
  onFieldChange: () => void;
  onFieldKeyPress: () => void;
}

class AccountChooseForm extends React.Component<AccountBasicSettingsFormProps> {
  static displayName = 'AccountChooseForm';

  static submitLabel = account => {
    return localized('Continue');
  };

  static titleLabel = () => {
    return localized('Connect an email account');
  };

  static subtitleLabel = () => {
    return localized(
      `Enter your email account credentials to get started. Mailspring\nstores your email password securely and it is never sent to our servers.`
    );
  };

  static validateAccount = account => {
    let errorMessage = null;
    const errorFieldNames = [];

    if (
      !RegExpUtils.emailRegex().test(account.emailAddress) ||
      (!account.settings.imap_password && !account.emailAddress.endsWith('@gmail.com'))
    ) {
      return { errorMessage, errorFieldNames, populated: false };
    }

    return { errorMessage, errorFieldNames, populated: true };
  };

  // OnboardingActions.chooseAccountProvider(provider)

  async submit() {
    // create a new account with expanded settings and just the three fields
    const {
      name,
      emailAddress,
      settings: { imap_password },
    } = this.props.account;
    const provider = emailAddress.endsWith('@gmail.com') ? 'gmail' : 'imap';
    if (provider === 'gmail') {
      OnboardingActions.moveToPage('account-settings-gmail');
      return;
    }

    let account = new Account({ name, emailAddress, provider, settings: { imap_password } });
    account = await expandAccountWithCommonSettings(account);
    OnboardingActions.setAccount(account);

    // if (account.settings.imap_host && account.settings.smtp_host) {
    //   // expanding the account settings succeeded - try to authenticate
    //   this.props.onConnect(account);
    // } else {
    //   // we need the user to provide IMAP/SMTP credentials manually
    OnboardingActions.moveToPage('account-settings-imap');
    // }
  }

  render() {
    return (
      <form className="settings">
        <FormField field="name" title={localized('Name')} {...this.props} />
        <FormField field="emailAddress" title={localized('Email')} {...this.props} />
        <FormField
          field="settings.imap_password"
          title="Password"
          type="password"
          containerStyle={{
            opacity: this.props.account.emailAddress.endsWith('@gmail.com') ? 0 : 1,
          }}
          {...this.props}
        />
      </form>
    );
  }
}

export default CreatePageForForm(AccountChooseForm);
