class GithubPullRequest
  def initialize(json)
    @mash = Hashie::Mash.new(JSON.parse(json))
  end

  def repo_name
    @mash.repository.try(:name)
  end

  def user_name
    @mash.repository.try(:owner).try(:name)
  end

  def user_login
    @mash.repository.try(:owner).try(:login)
  end

  def commits
    @mash.commits || []
  end

  def action
    @mash.action
  end

  def number
    @mash.number
  end
end
