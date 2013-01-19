if Rails.env.development?
  if ENV['GITHUB_KEY'].blank? || ENV['GITHUB_SECRET'].blank?
    raise "Provide ENV['GITHUB_KEY'] and ENV['GITHUB_SECRET']"
  end
end

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :developer unless Rails.env.production?
  provider :github, ENV['GITHUB_KEY'], ENV['GITHUB_SECRET'], scope: "public_repo"
end
