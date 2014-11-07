Overview
================

CLAHub provides a low-friction way to have a Contributor License Agreement for
your open source project that's hosted on GitHub.  Contributors digitally sign
your CLA by signing in with GitHub.  Then, it automatically marks up your pull
requests based on whether the contributors have all signed your CLA.

Usage
================

Create an Agreement
-------------------
* Sign in with Github by clicking the “Sign in with GitHub to get started” button.
* Click on “My agreements and signatures” link in top menu bar
* Click on “Create a new agreement” button
* Select one or more repositories that will be included in the CLA by clicking or writing the repository name, please note repositories listed are those you own or listed as an administrator of. To remove a repository from an agreement, click on the “x” icon next to the repository name.
* Write the CLA agreement text. Remember you can use markdown. Click the “preview” link to preview your CLA agreement text.
* Select fields the CLA form will include. When user agrees to CLA, these fields will be required.
* Finally click the “create agreement” button.

Sharing an Agreement
--------------------
So, you created one but want to people to sign it, good news just share a link:
1. Sign in with Github by clicking the “Sign in with GitHub to get started” button.
2. Click on “My agreements and signatures” link in top menu bar.
3. Click on a repo from the "Agreements you have created" section.
4. At the bottom of the page, you'll find the "Link from your contributing guidelines" header with a link to share your agreement below it.

Signatures
--------------------
1. Sign in with Github by clicking the “Sign in with GitHub to get started” button.
2. Click on “My agreements and signatures” link in top menu bar.
3. Click on a repo from the "Agreements you have created" section.
4. At the bottom of the page, you'll find the "Users who have signed" header with a list of all the users who agreed to your CLA and a link to download the list as a CSV file.


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

Deployment
================
See DEPLOY.md for information on deploying.

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

Or as normal (.env is loaded by `dotenv` gem):

    rails server
    rails console

LiveReload
----------------

When working on display-heavy features, [LiveReload](http://livereload.com/)
saves valuable keystrokes and time.  We use
[guard-livereload](https://github.com/guard/guard-livereload) to watch
templates and assets and reload when they change.

To take advantage of this:

* Install a [LiveReload browser extension](http://feedback.livereload.com/knowledgebase/articles/86242-how-do-i-install-and-use-the-browser-extensions-)
* Run `guard` on the command line.

Development and Webhooks
------------------------

As part of the app, we sign up to receive GitHub webhooks (HTTP requests to
`/repo_hook`) to be notified when stuff happens to repos we care about.  (In
particular, we want to know about new pushes so we can assess whether their
contributors have agreed to the relevant CLA.)

When you're developing locally, GitHub can't send webhook events
to you at `localhost:3000`, so use a local tunnelling service like
[ngrok](https://ngrok.com) or [localtunnel.me](https://localtunnel.me).

Then, you should run the Rails server with the `HOST` environment variable
set, like `HOST=http://my.fancy.dynamic.host.name rails server`, or set it in `.env`
if using `foreman`.  This is read in `config/initializers/host.rb`

*Note* that the dynamic hostname you use is saved in the GitHub webhook 
registrations.  If your dynamic hostname changes, you will need to update the
webhooks in GitHub so that it knows where to send the requests.




Testing
=======

Coverage
----------------

Use SimpleCov to build code coverage:

    COVERAGE=true rake

Deployment
================
See DEPLOY.md for information on deploying.