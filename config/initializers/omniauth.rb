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
  if ENV['GITHUB_KEY'].blank? || ENV['GITHUB_SECRET'].blank? || ENV['GITHUB_LIMITED_KEY'].blank? || ENV['GITHUB_LIMITED_SECRET'].blank?
    raise "Provide ENV['GITHUB_KEY'], ENV['GITHUB_SECRET'], ENV['GITHUB_LIMITED_KEY'] and ENV['GITHUB_LIMITED_SECRET']"
  end
end

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :developer unless Rails.env.production?
  provider :github, ENV['GITHUB_KEY'], ENV['GITHUB_SECRET'], scope: "public_repo"
  provider :github_limited, ENV['GITHUB_LIMITED_KEY'], ENV['GITHUB_LIMITED_SECRET'], scope: "(no scope)"
end
