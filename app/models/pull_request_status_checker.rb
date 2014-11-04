class PullRequestStatusChecker
  STATUS_DESCRIPTIONS = {
    true => 'CLAHub: All contributors have signed the Contributor License Agreement.',
    false => 'CLAHub: Not all contributors have signed the Contributor License Agreement.'
  }

  def initialize(pull_request)
    @pull_request = pull_request
  end

  def check_and_update
    Rails.logger.info("PullRequestStatusChecker#check_and_update for pull_request #{@pull_request.user_login}/#{@pull_request.repo_name}:#{@pull_request.number}")
    return unless repo_agreement

    gh = GithubRepos.new(repo_agreement.user)
    commits = gh.get_pull_commits(@pull_request.user_login, @pull_request.repo_name,
      pull_id = @pull_request.number)

    final_status = true
    last_commit = nil

    commits = commits.sort_by do |commit|
      commit.committer.date
    end

    commits.each do |commit|
      final_status &&= check_commit(commit)
      last_commit = commit
    end

    target_url = "#{HOST}/agreements/#{@pull_request.user_login}/#{@pull_request.repo_name}"
    gh = GithubRepos.new(repo_agreement.user)
    gh.set_status(@pull_request.user_login, @pull_request.repo_name, sha = last_commit.sha, {
      state: final_status ? 'success' : 'failure',
      target_url: target_url,
      description: STATUS_DESCRIPTIONS[final_status],
      context: "clahub"
    })
  end

  private

  # TODO: extract a CommitStatusChecker
  def check_commit(commit)
    contributors = commit_contributors(commit)
    all_contributors_signed = contributors.all? { |contributor| signed_agreement?(contributor) }

    if all_contributors_signed
      mark(commit, true)
      return true
    else
      mark(commit, false)
      return false
    end
  end

  def mark(commit, state)
    target_url = "#{HOST}/agreements/#{@pull_request.user_login}/#{@pull_request.repo_name}"

    gh = GithubRepos.new(repo_agreement.user)
    gh.set_status(@pull_request.user_login, @pull_request.repo_name, sha = commit.sha, {
      state: state ? 'success' : 'failure',
      target_url: target_url,
      description: STATUS_DESCRIPTIONS[state],
      context: "clahub"
    })
  end

  def commit_contributors(commit)
    author_email = commit.author.try(:email)
    author_username = commit.author.try(:login)
    author = User.find_by_email_or_nickname(author_email, author_username)
    contributors = [author]

    if commit.committer
      committer_email = commit.committer.try(:email)
      committer_username = commit.committer.try(:login)
      committer = User.find_by_email_or_nickname(committer_email, committer_username)
      contributors << committer
    end

    contributors
  end

  def signed_agreement?(candidate)
    return false if candidate.nil?

    Signature.exists?({
      user_id: candidate.id,
      agreement_id: repo_agreement.id
    })
  end

  def repo_agreement
    @repo_agreement ||= Agreement.where({
      user_name: @pull_request.user_login,
      repo_name: @pull_request.repo_name
    }).first
  end
end
