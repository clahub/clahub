class CheckOpenPullsJob
  # Allow most specs to disable this
  cattr_accessor :enabled
  self.enabled = true

  def initialize(options)
    @owner = options[:owner]
    @user_name = options[:user_name]
    @repo_name = options[:repo_name]
  end

  def run
    return true if !self.enabled

    pull_request_commit_groups.each do |commit_group|
      commit_group.check_and_update
    end
  end

  private

  def pull_request_commit_groups
    pull_mashes.map do |pull_mash|
      commit_group = CommitGroup.new(@user_name, @repo_name)
      commit_group.fetch_from_pull_request(pull_mash.number)

      commit_group
    end
  end

  def pull_mashes
    github_repos.get_pulls(@user_name, @repo_name)
  end

  def github_repos
    @github_repos ||= GithubRepos.new(@owner)
  end
end
