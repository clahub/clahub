source 'https://rubygems.org'

ruby "2.1.1" # make sure .ruby-version agrees

gem 'rails', '3.2.19'

gem 'pg'
gem 'jquery-rails'
gem 'thin'
gem 'bootstrap-sass', '~> 2.3'
gem 'sass', "~> 3.2.0"
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

group :development do
  gem 'pry'
  gem 'pry-rails'
  # gem 'pry-debugger'
  gem 'pry-remote'
  gem 'debugger-linecache', '1.2.0'
  gem 'httplog'
  gem "better_errors"
  gem "binding_of_caller"
end

group :test do
  gem 'launchy'
  gem 'capybara'
  gem 'shoulda-matchers'
  gem 'factory_girl_rails'
  gem 'webmock'
  gem 'poltergeist'
  gem 'database_cleaner'
end

group :test, :development do
  gem 'rspec-rails', '~> 2.0'
  gem 'simplecov', require: false
  gem 'dotenv'
  gem 'guard-livereload'
  gem 'jazz_hands'
end

group :development, :darwin do
  gem 'rb-fsevent', '~> 0.9.1'
end

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 3.2.3'
  gem 'coffee-rails', '~> 3.2.1'
  gem 'uglifier', '>= 1.0.3'
end

gem 'rails_12factor', group: :production