# 💌 Mailspring Free build

[![Travis Status](https://travis-ci.org/Toxblh/Mailspring.svg?branch=master)](https://travis-ci.org/Toxblh/Mailspring)

Mailspring is a email client that is fast, free and beautiful. This Free build comes with no telemetry at all, and is still filled with powerful features you will love, like Unified Inbox, Snooze, Send Later, Mail Rules, Templates and more!

![Mailspring Screenshot](https://github.com/Toxblh/Mailspring/raw/master/screenshots/hero_graphic_mac%402x.png)

## Download Mailspring

N. B. Please note that **Mailspring Free build isn't fully open source right now**: the sync engine, MailSync, is [proprietary](https://github.com/Toxblh/Mailspring/blob/master/LICENSE-mailsync.md), and while we're working on replacing it, it probably won't happen anytime soon. By downloading Mailspring Free build, you accept the MailSync license (which doesn't affect you as a regular user).

You can download compiled versions of Mailspring Free build for Linux (deb and rpm – Windows and macOS support coming soon!) from [GitHub Releases](https://github.com/Toxblh/Mailspring/releases/). There's also an [AUR package (soon)]().

## Contributing

Our UI is entirely open-source and pull requests and contributions are welcome! There are a few ways to contribute: building a plugin, building a theme, improving translations, and submitting pull requests to the project itself.

Mailspring's MailSync, however, is closed source. You can read more about the reasons why this is in the [roadmap](https://github.com/Foundry376/Mailspring/blob/master/ROADMAP.md#why-is-mailsync-closed-source).

### Building A Plugin

Plugins lie at the heart of Mailspring and give it its powerful features. Building your own plugins allows you to integrate the app with other tools, experiment with new workflows, and more. Follow the [Getting Started guide](https://Foundry376.github.io/Mailspring/) to write your first plugin in five minutes.

- To create your own theme, check out the [Mailspring-Theme-Starter](https://github.com/Foundry376/Mailspring-Theme-Starter).

- To create your own plugin, check out the [Mailspring-Plugin-Starter](https://github.com/Foundry376/Mailspring-Plugin-Starter).

A plugin "store" like the Chrome Web Store is coming soon, and will make it easy for other users to discover plugins you create. (Right now, users need to "sideload" the plugins into the app by downloading them and copying them into place.)

### Building a Theme

The Mailspring user interface is styled using CSS, which means it's easy to modify and extend. Mailspring comes stock with a few beautiful themes, and there are many more which have been built by community developers. To start creating a theme, [clone the theme starter](https://github.com/Foundry376/Mailspring-Theme-Starter)!

If you are updating an existing Nylas theme for Mailspring here is a [step by step tutorial](https://foundry376.zendesk.com/hc/en-us/articles/115001918391-How-do-I-update-an-N1-Nylas-Mail-theme-for-Mailspring-). Notice: as part of the update process you will probably need to [import mailspring base variables](https://github.com/Foundry376/Mailspring/issues/326#issuecomment-343757775).

### Localizing / Translating

Mailspring 1.5.0 and above support localization. If you're a fluent speaker of another language, we'd love your help improving translations. Check out the [LOCALIZATION](https://github.com/Toxblh/Mailspring/blob/master/LOCALIZATION.md) guide for more information.

### Contributing to Mailspring Free build

Pull requests are always welcome - check out [CONTRIBUTING](https://github.com/Toxblh/Mailspring/blob/master/CONTRIBUTING.md) for more information about setting up the development environment, running tests locally, and submitting pull requests.
