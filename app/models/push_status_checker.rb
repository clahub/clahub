class PushStatusChecker
  def initialize(push)
    @push = push
  end

  def check_and_update
    Rails.logger.info("PushStatusChecker#check_and_update for push #{@push.user_name}/#{@push.repo_name}:#{@push.commits.map(&:id).join(',')}")
    return unless repo_license

    if all_contributors_have_signed_agreement?
      mark_commits_as_successful
    else
      mark_commits_as_failed
    end
  end

  private

  def mark_commits_as_successful
    @push.commits.each do |commit|
      mark_commit(commit, {
        state: 'success',
        target_url: "#{HOST}/licenses/#{@push.user_name}/#{@push.repo_name}",
        description: 'All contributors have signed the Contributor License Agreement.'
      })
    end
  end

  def mark_commits_as_failed
    @push.commits.each do |commit|
      mark_commit(commit, {
        state: 'failure',
        target_url: "#{HOST}/licenses/#{@push.user_name}/#{@push.repo_name}",
        description: 'Not all contributors have signed the Contributor License Agreement.'
      })
    end
  end

  def mark_commit(commit, params)
    GithubRepos.new(repo_license.user).set_status(@push.user_name, @push.repo_name, sha = commit.id, params)
  end

  def all_contributors_have_signed_agreement?
    contributors = @push.commits.map { |commit|
      commit_contributors(commit)
    }.flatten

    contributors.all? { |contributor|
      signed_agreement?(contributor)
    }
  end

  def commit_contributors(commit)
    author_email = commit.author.try(:email)
    author_username = commit.author.try(:username)
    author = User.find_by_email_or_nickname(author_email, author_username)

    [author]
  end

  def signed_agreement?(candidate)
    return false if candidate.nil?

    Agreement.exists?({
      user_id: candidate.id,
      license_id: repo_license.id
    })
  end

  def repo_license
    @repo_license ||= License.where({
      user_name: @push.user_name,
      repo_name: @push.repo_name
    }).first
  end
end
