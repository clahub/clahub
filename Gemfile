source 'https://rubygems.org'

gem 'rails', '3.2.11'

gem 'pg'
gem 'jquery-rails'
gem 'thin'
gem 'bootstrap-sass'
gem 'chosen-rails'
gem 'omniauth'
gem 'omniauth-github'
gem 'github_api'
gem 'dynamic_form'
gem 'rack-canonical-host'

group :development do
  gem 'localtunnel'
end

group :test do
  gem 'capybara'
  gem 'shoulda-matchers'
  gem 'factory_girl_rails'
  gem 'webmock'
end

group :test, :development do
  gem 'rspec-rails', '~> 2.0'
  gem 'pry'
  gem 'pry-rails'
  gem 'pry-debugger'
  gem 'pry-remote'
  gem 'simplecov', require: false
  gem 'dotenv'
end

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 3.2.3'
  gem 'coffee-rails', '~> 3.2.1'
  gem 'uglifier', '>= 1.0.3'
end
