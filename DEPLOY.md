Heroku
===============

First, install [Heroku toolbelt](https://toolbelt.heroku.com/) and follow their
"Getting started" instructions.

Then, for an app named "my-clahub":

    heroku create my-clahub
    heroku config:add SECRET_TOKEN=some-random-key-with-plenty-of-entropy-here

Note that the `SECRET_TOKEN` MUST be at least 30 characters.

Push the code up:

    git push heroku master

Migrate the database:

    heroku run rake db:migrate

Register for a new [GitHub application](https://github.com/settings/applications/new)
OAuth key/secret pair, and add it to the Heroku environment:

    heroku config:add GITHUB_KEY=aaa111bbb GITHUB_SECRET=ccc222ddd

Domain name
------------------

If you want to enforce a canonical hostname (e.g. host at www.my-clahub.com and
redirect my-clahub.herokuapp.com to www.my-clahub.com):

    heroku domains:add www.my-clahub.com
    heroku config:add CANONICAL_URL=www.my-clahub.com

At your DNS provider, add a CNAME from www.my-clahub.com to my-clahub.herokuapp.com
