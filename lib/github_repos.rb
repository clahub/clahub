class GithubRepos
  REPOS_PER_PAGE = 1000

  def initialize(user)
    @github ||= Github.new(oauth_token: user.oauth_token)
  end

  def repos
    @github.repos.list(per_page: REPOS_PER_PAGE).sort_by(&:name)
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
end
