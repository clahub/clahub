#!/bin/bash

PHANTOMJS_VERSION=1.9.8-linux-i686

echo "Updating package cache"
sudo apt-get update -y > /dev/null

echo "Installing system dependencies"
sudo apt-get install -y \
  build-essential zlib1g-dev libssl-dev libreadline6-dev libyaml-dev \
  postgresql \
  nodejs

# Ruby (version available on apt is out-of-date)
echo "Installing Ruby"
# Required by the `nokogiri` gem
sudo apt-get install -y libxslt1-dev
# Required to install the `pg` gem
sudo apt-get install -y libpq-dev
cd /tmp
wget http://cache.ruby-lang.org/pub/ruby/2.1/ruby-2.1.4.tar.gz
tar -xvzf ruby-2.1.4.tar.gz
cd ruby-2.1.4/
./configure --prefix=/usr/local
make
sudo make install
gem install bundler

# PhantomJS (version available on apt is out-of-date)
echo "Installing PhatomJS"
sudo apt-get install -y fontconfig
wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-$PHANTOMJS_VERSION.tar.bz2
tar -xvjf phantomjs-$PHANTOMJS_VERSION.tar.bz2
cp phantomjs-$PHANTOMJS_VERSION/bin/phantomjs /usr/local/bin/

cd /vagrant

echo "Installing gems"
# Fully-qualified path to bundler necessary to disambiguate from the version
# installed by Vagrant (which uses Ruby 1.9)
/usr/local/lib/ruby/gems/2.1.0/gems/bundler-1.7.12/bin/bundle

echo "Preparing database"
# "Force Postgres to install with UTF8 encoding, not LATIN1?"
# http://stackoverflow.com/questions/20815440/force-postgres-to-install-with-utf8-encoding-not-latin1
sudo pg_dropcluster --stop 9.1 main
sudo pg_createcluster --locale en_US.UTF-8 --start 9.1 main

sudo -u postgres psql -c "CREATE ROLE vagrant SUPERUSER LOGIN;"
sudo -u postgres psql -c "CREATE DATABASE vagrant ENCODING 'utf8';"

rake db:create db:migrate db:test:prepare
