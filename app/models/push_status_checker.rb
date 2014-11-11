class PushStatusChecker
  STATUS_DESCRIPTIONS = {
    'success' => 'All contributors have signed the Contributor License Agreement.',
    'failure' => 'Not all contributors have signed the Contributor License Agreement.'
  }

  def initialize(push)
    @push = push
  end

  def check_and_update
    # TODO: Review the following code:
    # Rails.logger.info("PushStatusChecker#check_and_update for push #{@push.user_name}/#{@push.repo_name}:#{@push.commits.map(&:id).join(',')}")
    return unless repo_agreement

    @push.commits.each do |commit|
      check_commit(commit)
    end
  end

  private

  # TODO: extract a CommitStatusChecker
  def check_commit(commit)
    contributors = commit_contributors(commit)
    all_contributors_signed = contributors.all? { |contributor| signed_agreement?(contributor) }

    if all_contributors_signed
      mark(commit, 'success')
    else
      mark(commit, 'failure')
    end
  end

  def mark(commit, state)
    target_url = "#{HOST}/agreements/#{@repo_agreement.slug}"
    Rails.logger.info "MARKED COMMIT #{@push.user_name} - #{@push.repo_name} - #{commit.id} - #{state} - #{target_url}"
    Rails.logger.info "USER #{repo_agreement.user} - #{repo_agreement}"

    GithubRepos.new(repo_agreement.user).set_status(@push.user_name, @push.repo_name, sha = commit.id, {
      state: state,
      target_url: target_url,
      description: STATUS_DESCRIPTIONS[state],
      context: "clahub"
    })
  end

  def commit_contributors(commit)
    author_email = commit.author.try(:email)
    author_username = commit.author.try(:username)
    author = User.find_by_email_or_nickname(author_email, author_username)
    contributors = [author]

    if commit.committer
      committer_email = commit.committer.try(:email)
      committer_username = commit.committer.try(:username)
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
    @repo_agreement ||= Repository.where({
      user_name: @push.user_name,
      repo_name: @push.repo_name
    }).first.try(:agreement)
  end
end
