class CommitGroup
  STATUS_DESCRIPTIONS = {
    'success' => 'All contributors have signed the Contributor License Agreement.',
    'failure' => 'Not all contributors have signed the Contributor License Agreement.'
  }

  def initialize(repo_owner_name, repo_name)
    @repo_owner_name = repo_owner_name
    @repo_name = repo_name
  end

  def check_and_update
    ids = @commits.map { |commit| commit["id"] }.join(",")
    Rails.logger.info(
      "PushStatusChecker#check_and_update for push #{@repo_owner_name}/#{@repo_name}:#{ids}")
    return unless repo_agreement

    @commits.each do |commit|
      check_commit(commit)
    end
  end

  def fetch_from_pull_request(pull_request_number)
    @commits = github_repos.get_pull_commits(
        @repo_owner_name, @repo_name, pull_request_number
      ).map { |commit_hash|
          # TODO: Add test case for no author only committer on this phase
          commit = { id: commit_hash.sha }
          commit[:author] = { username: commit_hash.author.login } if commit_hash.author
          commit[:committer] = { username: commit_hash.committer.login } if commit_hash.committer
          Hashie::Mash.new(commit)
        }

    @commits
  end

  def set_from_payload(payload)
    @commits = payload.commits || []

    @commits
  end

  def length
    @commits && @commits.length || 0
  end

  private

  # TODO: extract a CommitStatusChecker
  def check_commit(commit)
    contributors = commit_contributors(commit)
    all_contributors_signed = contributors.all? { |contributor|
      signed_agreement?(contributor)
    }

    if all_contributors_signed
      mark(commit, 'success')
    else
      mark(commit, 'failure')
    end
  end

  def mark(commit, state)
    target_url = "#{HOST}/agreements/#{@repo_owner_name}/#{@repo_name}"

    github_repos.set_status(@repo_owner_name, @repo_name, commit.id, {
      state: state,
      target_url: target_url,
      description: STATUS_DESCRIPTIONS[state],
      context: "clahub"
    })
  end

  def commit_contributors(commit)
    contributors = []

    if commit.author
      author_email = commit.author.email
      author_username = commit.author.username
      author = User.find_by_email_or_nickname(author_email, author_username)
      contributors << author
    end

    if commit.committer
      committer_email = commit.committer.email
      committer_username = commit.committer.username
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

  def github_repos
    @github_repos ||= GithubRepos.new(repo_agreement.user)
  end

  # TODO: Move this logic into the `github_repos` method if it isn't needed
  # elsewhere.
  def repo_agreement
    @repo_agreement ||= Agreement.where({
      user_name: @repo_owner_name,
      repo_name: @repo_name
    }).first
  end
end
