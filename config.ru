# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment',  __FILE__)
use Rack::CanonicalHost, ENV['CANONICAL_HOST'] if ENV['CANONICAL_HOST']
use Rack::SslEnforcer, :only_environments => ['production'] unless ENV['DISABLE_SSL_ENFORCEMENT']
run Clahub::Application
