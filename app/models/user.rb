class User < ActiveRecord::Base
  has_many :agreements
  has_many :signatures
  has_many :signed_agreements, :through => :signatures, :source => :agreement

  def self.find_or_create_for_github_oauth(oauth)
    attributes_to_update = [:name, :nickname, :oauth_token, :email]

    self.find_or_create_by_uid(oauth[:uid]).tap do |user|
      oauth.slice(*attributes_to_update).each do |key, value|
        user.send("#{key}=", value)
      end
      user.save
    end
  end

  def self.find_by_email_or_nickname(email, nickname)
    self.where("email = ? OR nickname = ?", email, nickname).first
  end
  
  def repos
    DevModeCache.cache("repos-for-#{uid}") do
      GithubRepos.new(self).repos
    end
  end
  
  def admin_of_repos?
    repos.present? || Rails.env.development?
  end
  
  def member_of_hybridgroup?
    if Rails.env.development?
      true
    else
      DevModeCache.cache("member-of-#{GithubRepos::ORGANIZATION}") do
        GithubRepos.new(self).organization_members.include?(nickname)
      end
    end
  end
end