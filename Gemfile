source 'https://rubygems.org'

ruby "3.3.4" # make sure .ruby-version agrees

gem 'rails', '~> 5'

gem 'pg'
gem 'jquery-rails'
gem 'thin'
gem 'bootstrap-sass', "~> 3.4"
gem 'sass', "~> 3.2"
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
  gem 'debugger-linecache', '1.2.0'
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
  gem 'test-unit', '~> 3.0'
end

group :test, :development do
  gem 'rspec-rails', '~> 2.0'
  gem 'simplecov', require: false
  gem 'guard-livereload'
end

group :development, :darwin do
  gem 'rb-fsevent', '~> 0.9.1'
end

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 6.0.0'
  gem 'coffee-rails', '~> 5.0.0'
  gem 'uglifier', '>= 1.0.3'
end
