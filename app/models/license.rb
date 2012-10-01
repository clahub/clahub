class License < ActiveRecord::Base
  belongs_to :user
  has_many :agreements
  has_many :agreeing_users, through: :agreements, source: :user

  validates :repo_name, presence: true
  validates :user_name, presence: true
  validates :text, presence: true

  attr_accessible :repo_name, :text

  before_validation :set_user_name_from_user_nickname

  def create_github_repo_hook
    hook_inputs = {
      'name' => 'web',
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    github = Github.new(oauth_token: self.user.oauth_token)
    github.repos.hooks.create(user_name, repo_name, hook_inputs)
  end

  private

  def set_user_name_from_user_nickname
    self.user_name = user.try(:nickname)
  end
end
