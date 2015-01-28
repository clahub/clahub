require 'spec_helper'

# GitHub's PullRequestEvent:
# https://developer.github.com/v3/activity/events/types/#pullrequestevent

describe 'receiving github repo "PullRequest" webhook callbacks' do
  let(:token) { 'abc123' }

  before do
    mock_github_oauth(credentials: { token: token })
    mock_github_set_commit_status({ oauth_token: token, user_name: 'the_owner', repo_name: 'mangostickyrice', sha: 'aaa111' })
    mock_github_set_commit_status({ oauth_token: token, user_name: 'the_owner', repo_name: 'mangostickyrice', sha: 'bbb222' })
  end

  it 'correctly re-checks many commits in response to a pull request synchronization' do
    owner = create(:user, nickname: 'the_owner', oauth_token: token)
    author1 = create(:user, email: 'jasonm@gmail.com', nickname: 'jasonm')
    agreement = create(:agreement, user: owner, repo_name: 'mangostickyrice')
    create(:signature, user: author1, agreement: agreement)
    mock_github_user_repos(oauth_token: oauth_token_for('the_owner'),
      repos: [
        { name: 'mangostickyrice',  id: 456, owner: { login: 'the_owner' } }
      ]
    )

    mock_github_open_pulls(owner: 'the_owner', repo: 'mangostickyrice', pull_ids: [23])

    mock_github_pull_commits(
      owner: 'the_owner', repo: 'mangostickyrice', pull_id: '23',
      commits: [
        { author: { login: 'jasonm' }, sha: 'aaa111' },
        { author: { login: 'jugglinmike' }, sha: 'bbb222' }
      ]
    )

    payload = {
      action: 'synchronize',
      repository: { name: 'mangostickyrice', owner: { login: 'the_owner' } },
      pull_request: { number: 23 }
    }
    post '/repo_hook', { payload: payload.to_json }, 'HTTP_X_GITHUB_EVENT' => 'pull_request'

    status_url = "https://api.github.com/repos/the_owner/mangostickyrice/statuses/aaa111?access_token=#{token}"
    status_params = {
      state: 'success',
      target_url: "#{HOST}/agreements/the_owner/mangostickyrice",
      description: 'All contributors have signed the Contributor License Agreement.',
      context: "clahub"
    }
    expect(a_request(:post, status_url).with(body: status_params.to_json)).to have_been_made

    status_url = "https://api.github.com/repos/the_owner/mangostickyrice/statuses/bbb222?access_token=#{token}"
    status_params = {
      state: 'failure',
      target_url: "#{HOST}/agreements/the_owner/mangostickyrice",
      description: 'Not all contributors have signed the Contributor License Agreement.',
      context: "clahub"
    }
    expect(a_request(:post, status_url).with(body: status_params.to_json)).to have_been_made
  end
end
