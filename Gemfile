source 'https://rubygems.org'

ruby "3.3.4" # make sure .ruby-version agrees

gem 'rails'
gem 'pg'
gem 'jquery-rails'
gem 'thin'
gem 'bootstrap-sass'
gem 'sass'
gem 'chosen-rails'
gem 'omniauth'
gem 'omniauth-github'
gem 'github_api'
gem 'dynamic_form'
gem 'rack-canonical-host'
gem 'paul_revere'
gem 'kramdown'
gem 'newrelic_rpm'
gem 'rack-ssl-enforcer'
gem 'dotenv-rails'

group :development do
  gem 'pry'
  gem 'pry-rails'
  gem 'pry-remote'
  gem 'debugger-linecache'
  gem 'httplog'
end

group :test do
  gem 'launchy'
  gem 'capybara'
  gem 'shoulda-matchers'
  gem 'factory_girl_rails'
  gem 'webmock'
  gem 'poltergeist'
  gem 'database_cleaner'
  gem 'test-unit'
end

group :test, :development do
  gem 'rspec-rails'
  gem 'simplecov', require: false
  gem 'guard-livereload'
end

group :development, :darwin do
  gem 'rb-fsevent'
end

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails'
  gem 'coffee-rails'
  gem 'uglifier'
end
