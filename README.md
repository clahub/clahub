Overview
================

CLAHub provides a low-friction way to have a Contributor License Agreement for
your open source project that's hosted on GitHub.  Contributors digitally sign
your CLA by signing in with GitHub.  Then, it automatically marks up your pull
requests based on whether the contributors have all signed your CLA.

Right now it's running at <http://www.clahub.com>

I don't intend for this to lead to a proliferation of CLAs.  But when they're
appropriate, I hope it can reduce the friction of contribution.

This project is a work-in-progress.  Any and all feedback is welcome!

It currently works, but could use UI and functionality improvement.  Find
such discussion in [GitHub issues](https://github.com/jasonm/clahub/issues).

What's a CLA?
-------------
Contributor Agreements are a way to prove intellectual property (IP) provenance
of contributions to an open-source project.  They generally say that:

> 1. The code I’m contributing is mine, and I have the right to license it.

> 2. I’m granting you a license to distribute said code under the terms of this
> agreement (typically “as you see fit” or “under an OSI-approved license” or
> whatever).

-- From [_Contributor License Agreements_ by Jacob Kaplan-Moss](http://jacobian.org/writing/contributor-license-agreements/)

Here's some more background on CLAs:

* [Wikipedia page](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for CLAs
* [_A CLA By Any Other Name_ on Groklaw](http://www.groklaw.net/article.php?story=20110524120303815)

Want to choose a CLA?  Harmony Agreements is a web tool that helps you quickly select a CLA:
* <http://www.harmonyagreements.org/>

Legal disclaimer
----------------
I am not a lawyer, and none of the CLAhub documentation, functionality, or
other communication constitutes legal advice.  Consult your lawyer about
contributor agreements for your project.

Development
================

Prerequisites
----------------

Register a new app at GitHub to get an OAuth key and secret:

https://github.com/settings/applications/new

Set up a .env file with your GITHUB_KEY and GITHUB_SECRET.
You can also specify an HTTP port for local foreman:

    GITHUB_KEY=abc123
    GITHUB_SECRET=234897239872394832478
    PORT=3000

This file is .gitignored so it's private.

We use the `dotenv` gem to provide these variables to the test environment as
well.

JavaScript acceptance tests use
[poltergeist](https://github.com/jonleighton/poltergeist) which requires
installing [PhantomJS](http://phantomjs.org).  Follow the PhantomJS
installation instructions on the [poltergeist
README](https://github.com/jonleighton/poltergeist).

Getting set up
----------------

Install gems and initialize databases:

    bundle
    rake db:create db:migrate db:test:prepare

Run the tests to make sure things are working:

    rake

Running the app
----------------

Run with Foreman if you like:

    foreman start
    foreman run rails console

Or as normal (.env is loaded by `dotenv` gem):

    rails server
    rails console

Coverage
----------------

Use SimpleCov to build code coverage:

    COVERAGE=true rake

LiveReload
----------------

When working on display-heavy features, [LiveReload](http://livereload.com/)
saves valuable keystrokes and time.  We use
[guard-livereload](https://github.com/guard/guard-livereload) to watch
templates and assets and reload when they change.

To take advantage of this:

* Install a [LiveReload browser extension](http://feedback.livereload.com/knowledgebase/articles/86242-how-do-i-install-and-use-the-browser-extensions-)
* Run `guard` on the command line.

LocalTunnel
------------------

As part of the app, we sign up to receive GitHub webhooks (HTTP requests to
`/repo_hook`) to be notified when stuff happens to repos we care about.  (In
particular, we want to know about new pushes so we can assess whether their
contributors have agreed to the relevant CLA.)

When you're developing locally, GitHub can't send webhook events
to you at `localhost:3000`, so use [localtunnel](http://localtunnel.com) to get a
public proxy to `localhost`:

    $ START_LOCALTUNNEL=1 foreman start

This will create a new localtunnel via their API and cache the hostname into
`.localtunnel_host`.  When you create new `Agreement`s locally, this hostname
will be send to GitHub as the webhook receive endpoint.

If you kill your server and restart, you'd get a new host, and those webhook
endpoint URLs stored on GitHub need to be updated.  Currently there's no
automated fixup, but you can try to keep ahold of the previously cached
hostname with:

    $ READ_LOCALTUNNEL=1 foreman run rails console

Deployment
================
See DEPLOY.md for information on deploying.

License
================

See [LICENSE](https://raw.github.com/jasonm/blob/master/LICENSE) for the project license.

The "Clipboard and pencil" graphic used in the homepage logo is
licensed from iStockPhoto.com:

<http://www.istockphoto.com/stock-illustration-16006726-clipboard-and-pencil.php>

The graphic is licensed for a single-seat install and is in use at
http://www.clahub.com.  It is not licensed for multi-seat use, so any
other installations should purchase a separate license or use a different
image.

<http://www.istockphoto.com/help/licenses>
