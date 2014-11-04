Heroku
===============

First, install [Heroku toolbelt](https://toolbelt.heroku.com/) and follow their
"Getting started" instructions.

Then, for an app named "my-clahub":

    heroku apps:create my-clahub
    heroku config:set SECRET_TOKEN=some-random-key-with-plenty-of-entropy-here
    heroku addons:add heroku-postgresql

Note that the `SECRET_TOKEN` MUST be at least 30 characters. One way to generate it:

    heroku config:set SECRET_TOKEN=$( head /dev/random | base64 | head -n 1 )

Push the code up:

    git push heroku master

Migrate the database:

    heroku run rake db:migrate
    heroku run rake db:seed

Register for a new [GitHub application](https://github.com/settings/applications/new)
OAuth key/secret pair, and add it to the Heroku environment:

    heroku config:set GITHUB_KEY=aaa111bbb GITHUB_SECRET=ccc222ddd
    heroku restart

If you have problems, try running `heroku logs`.

Domain name
------------------

If you want to enforce a canonical hostname (e.g. host at www.my-clahub.com and
redirect my-clahub.herokuapp.com to www.my-clahub.com):

    heroku domains:add www.my-clahub.com
    heroku config:set CANONICAL_URL=www.my-clahub.com

At your DNS provider, add a CNAME from www.my-clahub.com to my-clahub.herokuapp.com


HTTPS
------------------

In the production environment, SSL is enforced.  If you really do not want SSL:

    heroku config:set DISABLE_SSL_ENFORCEMENT=true

Analytics
------------------

Google Universal Analytics is enabled if you set environment variables `UA_KEY`
and `UA_DOMAIN`.  The JavaScript is added from
`app/views/layouts/application.html.erb`.
