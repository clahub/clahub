class Repository < ActiveRecord::Base
  
  belongs_to :agreement
  
  attr_accessible :github_repo_hook_id, :agreement_id, :repo_name, :user_name

  validates :user_name, presence: true
  validates :repo_name, presence: true, uniqueness: { scope: :user_name }
  
  def create_github_repo_hook
    hook_inputs = {
      'name' => 'web',
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    response = GithubRepos.new(self.agreement.user).create_hook(user_name, repo_name, hook_inputs)

    self.update_attribute(:github_repo_hook_id, response['id'])
  end

  def delete_github_repo_hook
    if github_repo_hook_id
      GithubRepos.new(self.agreement.user).delete_hook(user_name, repo_name, github_repo_hook_id)
      self.update_attribute(:github_repo_hook_id, nil)
    end
  end

  def check_open_pulls
    # TODO: async this so that creating a signature doesn't take so long.
    CheckOpenPullsJob.new(owner: agreement.user, user_name: user_name, repo_name: repo_name).run
  end
  
  def name
    "#{user_name}/#{repo_name}"
  end

end