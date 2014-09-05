class GithubRepos
  REPOS_PER_PAGE = 100 # the max

  ALL_REPOS = "@ALL"

  def initialize(user)
    @github ||= Github.new(oauth_token: user.oauth_token, auto_pagination: true)
  end

  def repos
    [user_repos, org_repos].flatten
  end

  def orgs
    @github.orgs.list
  end

  def create_hook(user_name, repo_name, hook_inputs)
    @github.repos.hooks.create(user_name, repo_name, hook_inputs)
  end

  def delete_hook(user_name, repo_name, hook_id)
    @github.repos.hooks.delete(user_name, repo_name, hook_id)
  end

  def set_status(user_name, repo_name, sha, params)
    @github.repos.statuses.create(user_name, repo_name, sha, params)
  end

  def get_pulls(user_name, repo_name)
    @github.pull_requests.list(user_name, repo_name)
  end

  def get_pull_commits(user_name, repo_name, pull_id)
    @github.pull_requests.commits(user_name, repo_name, pull_id)
  end

  def org_repos(one_org='')
    repos = []
    @github.orgs.list.each do |org|
      if one_org.empty? || one_org == org.login
        @github.repos.list(org: org.login, per_page: REPOS_PER_PAGE).each do |repo|
          if repo.permissions.admin
            repos.push(repo)
          end
        end
      end
    end
    repos
  end
  private

  def user_repos
    @github.repos.list(per_page: REPOS_PER_PAGE).sort_by(&:name)
  end

end
