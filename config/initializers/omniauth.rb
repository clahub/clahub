raise "Provide ENV['GITHUB_KEY'] and ENV['GITHUB_SECRET']" unless Rails.env.test? || (ENV['GITHUB_KEY'] && ENV['GITHUB_SECRET'])

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :developer unless Rails.env.production?
  provider :github, ENV['GITHUB_KEY'], ENV['GITHUB_SECRET'], scope: "repo:status,public_repo"
end
