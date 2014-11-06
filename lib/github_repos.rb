class GithubRepos
  REPOS_PER_PAGE = 100 # the max
  ORGANIZATION = "hybridgroup"

  def initialize(user)
    @github ||= Github.new(oauth_token: user.oauth_token, auto_pagination: true)
  end

  def repos
    org_repos # show only org repos
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
  
  def organization_members
    @github.orgs.members.list(ORGANIZATION).collect(&:login)
  end
  
  def organizations
    @github.orgs.list
  end

  def user_repos
    @github.repos.list(per_page: REPOS_PER_PAGE).sort_by(&:name)
  end

  def org_repos(options = {})
    options = {must_be_admin: true}.merge!(options)
    repos = []
    @github.repos.list(org: ORGANIZATION, per_page: REPOS_PER_PAGE).each do |repo|
      if options[:must_be_admin]
        if repo.permissions.admin
          repos.push(repo)
        end
      else
        repos.push(repo)
      end
    end
    repos
  end
end
