class CheckOpenPullsJob
  # Allow most specs to disable this
  cattr_accessor :enabled
  self.enabled = true

  def initialize(options)
    @owner = options[:owner]
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
        @owner.nickname, @repo_name, pull_mash.number)

      # TODO this is a weird adapter, unweird it
      GithubPush.new({
        repository: {
          owner: { name: @owner.nickname },
          name: @repo_name
        },
        commits: commit_mashes.map { |mash|
          {
            author: { username: mash.author.login },
            id: mash.sha
          }.tap do |commit_hash|
            if mash.committer
              commit_hash[:committer] = { username: mash.committer.login }
            end
          end
        }
      }.to_json)
    end
  end

  def pull_mashes
    github_repos.get_pulls(@owner.nickname, @repo_name)
  end

  def github_repos
    @github_repos ||= GithubRepos.new(@owner)
  end
end
