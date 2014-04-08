# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment',  __FILE__)
use Rack::CanonicalHost, ENV['CANONICAL_HOST'] if ENV['CANONICAL_HOST']
unless ENV['DISABLE_SSL_ENFORCEMENT']
  use Rack::SslEnforcer, :only_environments => ['production'], :except => %r{^/repo_hook}
end

run Clahub::Application
