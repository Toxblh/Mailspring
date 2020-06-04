/* eslint global-require: 0 */

import crypto from 'crypto';
import { Account, IdentityStore, MailsyncProcess } from 'mailspring-exports';
import MailspringProviderSettings from './mailspring-provider-settings.json';
import MailcoreProviderSettings from './mailcore-provider-settings.json';
import dns from 'dns';
import { replace } from 'node-emoji';

export const LOCAL_SERVER_PORT = 12141;
export const LOCAL_REDIRECT_URI = `http://127.0.0.1:${LOCAL_SERVER_PORT}`;
const GMAIL_CLIENT_ID =
  process.env.MS_GMAIL_CLIENT_ID ||
  '662287800555-0a5h4ii0e9hsbpq0mqtul7fja0jhf9uf.apps.googleusercontent.com';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email', // email address
  'https://www.googleapis.com/auth/userinfo.profile', // G+ profile
  'https://mail.google.com/', // email
  'https://www.googleapis.com/auth/contacts', // contacts
  'https://www.googleapis.com/auth/calendar', // calendar
];

function idForAccount(emailAddress: string, connectionSettings) {
  // changing your connection security settings / ports shouldn't blow
  // away everything and trash your metadata. Just look at critiical fields.
  // (Me adding more connection settings fields shouldn't break account Ids either!)
  const settingsThatCouldChangeMailContents = {
    imap_username: connectionSettings.imap_username,
    imap_host: connectionSettings.imap_host,
    smtp_username: connectionSettings.smtp_username,
    smtp_host: connectionSettings.smtp_host,
  };

  const idString = `${emailAddress}${JSON.stringify(settingsThatCouldChangeMailContents)}`;
  return crypto
    .createHash('sha256')
    .update(idString, 'utf8')
    .digest('hex')
    .substr(0, 8);
}

function mxRecordsForDomain(domain) {
  return new Promise<string[]>((resolve, reject) => {
    // timeout here is annoyingly long - 30s?
    dns.resolveMx(domain, (err, addresses) => {
      if (err) {
        resolve([]);
      } else {
        resolve(addresses.map(a => a.exchange.toLowerCase()));
      }
    });
  });
}

export async function expandAccountWithCommonSettings(account: Account) {
  // see: https://developer.mozilla.org/en-US/docs/Mozilla/Thunderbird/Autoconfiguration

  const domain = account.emailAddress
    .split('@')
    .pop()
    .toLowerCase();
  const mxRecords = await mxRecordsForDomain(domain);
  console.log('MX', domain, ':', mxRecords);

  const populated = account.clone();

  const usernameWithFormat = format => {
    if (format === 'email') return account.emailAddress;
    if (format === 'email-without-domain') return account.emailAddress.split('@').shift();
    return undefined;
  };

  const getConfigForDomain = async (url, emailAddress) => {
    const r = await fetch(url);
    const doc = new DOMParser().parseFromString(await r.text(), 'application/xml');
    const imap = doc.querySelector("incomingServer[type='imap']");
    const smtp = doc.querySelector("outgoingServer[type='smtp']");

    return {
      imap_host: imap.getElementsByTagName('hostname')[0].textContent,
      imap_port: parseInt(imap.getElementsByTagName('port')[0].textContent),
      imap_username: imap
        .getElementsByTagName('username')[0]
        .textContent.replace('%EMAILADDRESS%', usernameWithFormat('email'))
        .replace('%EMAILLOCALPART%', usernameWithFormat('email-without-domain')),
      imap_password: populated.settings.imap_password,
      imap_security:
        imap.getElementsByTagName('socketType')[0].textContent == 'STARTTLS'
          ? 'STARTTLS'
          : 'SSL / TLS',
      imap_allow_insecure_ssl: false,

      smtp_host: smtp.getElementsByTagName('hostname')[0].textContent,
      smtp_port: parseInt(smtp.getElementsByTagName('port')[0].textContent),
      smtp_username: smtp
        .getElementsByTagName('username')[0]
        .textContent.replace('%EMAILADDRESS%', usernameWithFormat('email'))
        .replace('%EMAILLOCALPART%', usernameWithFormat('email-without-domain')),
      smtp_password: populated.settings.smtp_password || populated.settings.imap_password,
      smtp_security:
        smtp.getElementsByTagName('socketType')[0].textContent == 'STARTTLS'
          ? 'STARTTLS'
          : 'SSL / TLS',
      smtp_allow_insecure_ssl: false,
    };
  };

  const mxDomains = mxRecords.map(x =>
    x
      .split('.')
      .slice(-2)
      .join('.')
  );

  let template = {
    imap_host: `imap.${domain}`,
    imap_port: 993,
    imap_username: usernameWithFormat('email'),
    imap_password: populated.settings.imap_password,
    imap_security: 'SSL / TLS',
    imap_allow_insecure_ssl: false,

    smtp_host: `smtp.${domain}`,
    smtp_port: 587,
    smtp_username: usernameWithFormat('email'),
    smtp_password: populated.settings.smtp_password || populated.settings.imap_password,
    smtp_security: 'STARTTLS',
    smtp_allow_insecure_ssl: false,
  };

  const tryUrls = [
    `https://autoconfig.${domain}/mail/config-v1.1.xml?emailaddress=${account.emailAddress}`,
    ...mxDomains.map(
      x => `https://autoconfig.${x}/mail/config-v1.1.xml?emailaddress=${account.emailAddress}`
    ),
    `https://autoconfig.thunderbird.net/v1.1/${domain}`,
    ...mxDomains.map(x => `https://autoconfig.thunderbird.net/v1.1/${x}`),
  ];
  for (let url of tryUrls) {
    try {
      console.log('trying', url);
      template = await getConfigForDomain(url, account.emailAddress);
      break;
    } catch (e) {
      continue;
    }
  }
  console.log(template);

  if (template) {
    console.log(`Using template: ${JSON.stringify(template, null, 2)}`);
    populated.settings = Object.assign(template, populated.settings);
    return populated;
  }

  return populated;
}

export async function buildGmailAccountFromAuthResponse(code: string) {
  /// Exchange code for an access token
  const body = [];
  body.push(`code=${encodeURIComponent(code)}`);
  body.push(`client_id=${encodeURIComponent(GMAIL_CLIENT_ID)}`);
  body.push(`redirect_uri=${encodeURIComponent(LOCAL_REDIRECT_URI)}`);
  body.push(`grant_type=${encodeURIComponent('authorization_code')}`);

  const resp = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    body: body.join('&'),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  });

  const json = (await resp.json()) || {};
  if (!resp.ok) {
    throw new Error(
      `Gmail OAuth Code exchange returned ${resp.status} ${resp.statusText}: ${JSON.stringify(
        json
      )}`
    );
  }
  const { access_token, refresh_token } = json;

  // get the user's email address
  const meResp = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
    method: 'GET',
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const me = await meResp.json();
  if (!meResp.ok) {
    throw new Error(
      `Gmail profile request returned ${resp.status} ${resp.statusText}: ${JSON.stringify(me)}`
    );
  }
  const account = await expandAccountWithCommonSettings(
    new Account({
      name: me.name,
      emailAddress: me.email,
      provider: 'gmail',
      settings: {
        refresh_client_id: GMAIL_CLIENT_ID,
        refresh_token: refresh_token,
      },
    })
  );

  account.id = idForAccount(me.email, account.settings);

  // test the account locally to ensure the All Mail folder is enabled
  // and the refresh token can be exchanged for an account token.
  await finalizeAndValidateAccount(account);

  return account;
}

export function buildGmailAuthURL() {
  return `https://accounts.google.com/o/oauth2/auth?client_id=${GMAIL_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    LOCAL_REDIRECT_URI
  )}&response_type=code&scope=${encodeURIComponent(
    GMAIL_SCOPES.join(' ')
  )}&access_type=offline&select_account%20consent`;
}

export async function finalizeAndValidateAccount(account: Account) {
  if (account.settings.imap_host) {
    account.settings.imap_host = account.settings.imap_host.trim();
  }
  if (account.settings.smtp_host) {
    account.settings.smtp_host = account.settings.smtp_host.trim();
  }

  account.id = idForAccount(account.emailAddress, account.settings);

  // handle special case for exchange/outlook/hotmail username field
  // TODO BG: I don't think this line is in use but not 100% sure
  (account.settings as any).username =
    (account.settings as any).username || (account.settings as any).email;

  if (account.settings.imap_port) {
    account.settings.imap_port /= 1;
  }
  if (account.settings.smtp_port) {
    account.settings.smtp_port /= 1;
  }
  if (account.label && account.label.includes('@')) {
    account.label = account.emailAddress;
  }

  // Test connections to IMAP and SMTP
  const proc = new MailsyncProcess(AppEnv.getLoadSettings());
  proc.identity = IdentityStore.identity();
  proc.account = account;
  await proc.test();

  // Record the date of successful auth
  account.authedAt = new Date();
  return account;
}
