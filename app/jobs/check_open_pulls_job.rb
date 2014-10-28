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

    pushes.each do |push|
      PushStatusChecker.new(push).check_and_update
    end
  end

  private

  def pushes
    pull_mashes.map do |pull_mash|
      commit_mashes = github_repos.get_pull_commits(
        @user_name, @repo_name, pull_mash.number)

      # TODO this is a weird adapter, unweird it
      GithubPush.new({
        repository: {
          owner: { name: @user_name },
          name: @repo_name
        },
        commits: commit_mashes.map { |mash|
          # TODO: Add test case for no author only committer on this phase
          commit_hash = { id: mash.sha }
          commit_hash[:author] = { username: mash.author.login } if mash.author
          commit_hash[:committer] = { username: mash.committer.login } if mash.committer
          commit_hash
        }
      }.to_json)
    end
  end

  def pull_mashes
    github_repos.get_pulls(@user_name, @repo_name)
  end

  def github_repos
    @github_repos ||= GithubRepos.new(@owner)
  end
end
