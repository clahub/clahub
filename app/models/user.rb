class User < ActiveRecord::Base
  has_many :agreements
  has_many :signatures

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

end