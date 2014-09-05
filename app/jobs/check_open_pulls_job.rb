class CheckOpenPullsJob
  # Allow most specs to disable this
  cattr_accessor :enabled
  self.enabled = true

  def initialize(options)
    @owner = options[:owner]
    @user_name = options[:user_name]
    @repo_name = options[:repo_name]
    @other_repo_names = options[:other_repo_names]
  end

  def run
    return true if !self.enabled

    pushes.each do |push|
      PushStatusChecker.new(push).check_and_update
    end
  end

  private

  def pushes
    repos = []
    if @repo_name == GithubRepos::ALL_REPOS
      repos = @other_repo_names
    else
      repos << @repo_name
    end
    mashes = []
    for repo in repos
      mashes += pull_mashes(repo).map do |pull_mash|
        commit_mashes = github_repos.get_pull_commits(
          @user_name, repo, pull_mash.number)
  
        # TODO this is a weird adapter, unweird it
        GithubPush.new({
          repository: {
            owner: { name: @user_name },
            name: repo
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
    return mashes
  end

  def pull_mashes(repo)
    github_repos.get_pulls(@user_name, repo)
  end

  def github_repos
    @github_repos ||= GithubRepos.new(@owner)
  end
end
