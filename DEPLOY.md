Heroku
===============

After checking out this repostiory, install [Heroku toolbelt](https://toolbelt.heroku.com/) and follow their "Getting started" instructions.

Now, ensure you are inside the checked out directory and then, for an app named "my-clahub":

    heroku apps:create my-clahub
    heroku config:add SECRET_TOKEN=some-random-key-with-plenty-of-entropy-here
    heroku addons:add heroku-postgresql

Note that the `SECRET_TOKEN` MUST be at least 30 characters. One way to generate it:

    heroku config:add SECRET_TOKEN=$( head /dev/random | base64 | head -n 1 )

Push the code up:

    git push heroku master

Migrate the database:

    heroku run rake db:migrate
    heroku run rake db:seed

Register for two new [GitHub applications](https://github.com/settings/applications/new), one will be used for project owner signups and one for contributors signups.

You will need to configure the authorization callback URL for each:

    * Full access: https://my-clahub.herokuapp.com/auth/github/callback
    * Limited-access signature-only callback: https://my-clahub.herokuapp.com/auth/github_limited/callback

From the applications' page, copy the client keys and secrets, and add it to the Heroku environment:

    heroku config:add GITHUB_KEY=aaa111bbb GITHUB_SECRET=ccc222ddd
    heroku config:add GITHUB_LIMITED_KEY=aaa111bbb GITHUB_LIMITED_SECRET=ccc222ddd

The "limited" application will be used for the contributor signups. It will only be used for authorization and hence won't require any permissions to the contributor's account.

If you have problems, try running `heroku logs`.

Domain name
------------------

If you want to enforce a canonical hostname (e.g. host at www.my-clahub.com and
redirect my-clahub.herokuapp.com to www.my-clahub.com):

    heroku domains:add www.my-clahub.com
    heroku config:add CANONICAL_URL=www.my-clahub.com

At your DNS provider, add a CNAME from www.my-clahub.com to my-clahub.herokuapp.com

Host name
----------------
You also need to set your hostname as a `HOST` environment variable:

    heroku config:set HOST=https://my-cla.herokuapp.com

or edit `config/initializers/host.rb` and add your host name (either the domain name supplied by Heroku or your custom domain) to the `production` key. For example:

    'production'  => 'http://my-clahub.herokuapp.com'

HTTPS
------------------

In the production environment, SSL is enforced.  If you really do not want SSL:

    heroku config:add DISABLE_SSL_ENFORCEMENT=true

Analytics
------------------

Google Universal Analytics is enabled if you set environment variables `UA_KEY`
and `UA_DOMAIN`.  The JavaScript is added from
`app/views/layouts/application.html.erb`.
