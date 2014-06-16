Heroku
===============

First, install [Heroku toolbelt](https://toolbelt.heroku.com/) and follow their
"Getting started" instructions.

Then, for an app named "my-clahub":

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

Register for a new [GitHub application](https://github.com/settings/applications/new)
OAuth key/secret pair, and add it to the Heroku environment:

    heroku config:add GITHUB_KEY=aaa111bbb GITHUB_SECRET=ccc222ddd
    heroku restart

If you have problems, try running `heroku logs`.

Domain name
------------------

If you want to enforce a canonical hostname (e.g. host at www.my-clahub.com and
redirect my-clahub.herokuapp.com to www.my-clahub.com):

    heroku domains:add www.my-clahub.com
    heroku config:add CANONICAL_URL=www.my-clahub.com

At your DNS provider, add a CNAME from www.my-clahub.com to my-clahub.herokuapp.com


HTTPS
------------------

In the production environment, SSL is enforced.  If you really do not want SSL:

    heroku config:add DISABLE_SSL_ENFORCEMENT=true

Analytics
------------------

Google Universal Analytics is enabled if you set environment variables `UA_KEY`
and `UA_DOMAIN`.  The JavaScript is added from
`app/views/layouts/application.html.erb`.

Cloud Foundry
===============
eg: run.pivotal.io

Create a Postgres service
    
    export POSTGRES_SERVICE=your_service_name
    cf create-service elephantsql turtle $POSTGRES_SERVICE

Register for a new [GitHub application](https://github.com/settings/applications/new)
OAuth key/secret pair

    export GITHUB_KEY=aaa111bbb
    export GITHUB_SECRET=ccc222ddd

Upload:

    export APP_NAME="your-app-name"
    cf login -a https://api.run.pivotal.io ... #your login credentials
    cf target -s ... #the correct org and space
    cf push $APP_NAME -m 256M -c "bundle exec rake cf:on_first_instance db:migrate db:seed && bundle exec thin start -p \$PORT" # This will fail, since we haven't added the right env variables yet 
    cf set-env $APP_NAME SECRET_TOKEN $( head /dev/random | base64 | head -n 1 )
    cf set-env $APP_NAME GITHUB_KEY $GITHUB_KEY 
    cf set-env $APP_NAME GITHUB_SECRET $GITHUB_SECRET 
    cf bind-service $APP_NAME $POSTGRES_SERVICE
    cf push $APP_NAME #should succeed this time
