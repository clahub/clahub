OmniAuth.config.add_camelization 'github_limited', 'GitHubLimited'

module OmniAuth
  module Strategies
    class GitHubLimited < GitHub
      def name
        "github_limited"
      end
    end
  end
end

if Rails.env.development?
  missing = %w(GITHUB_KEY GITHUB_SECRET GITHUB_LIMITED_KEY GITHUB_LIMITED_SECRET).select do |key|
    ENV[key].blank?
  end
  raise "Provide #{missing.to_sentence}" if missing.any?
end

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :developer unless Rails.env.production?
  provider :github, ENV['GITHUB_KEY'], ENV['GITHUB_SECRET'], scope: "public_repo"
  provider :github_limited, ENV['GITHUB_LIMITED_KEY'], ENV['GITHUB_LIMITED_SECRET'], scope: "(no scope)"
end
