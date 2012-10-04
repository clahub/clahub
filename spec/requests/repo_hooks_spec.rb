require 'spec_helper'

describe 'receiving github repo webhook callbacks' do
  let(:token) { 'abc123' }

  before do
    mock_github_oauth(credentials: { token: token })
    mock_github_set_commit_status({ oauth_token: token, user_name: 'jasonm', repo_name: 'mangostickyrice', sha: 'aaa111' })
    mock_github_set_commit_status({ oauth_token: token, user_name: 'jasonm', repo_name: 'mangostickyrice', sha: 'bbb222' })
  end

  it 'gets a non-push event, responds with 200 OK' do
    post '/repo_hook', '{}', 'HTTP_X_GITHUB_EVENT' => 'slamalamadingdong'
    expect(response.code).to eq("200")
    expect(response.body).to eq("OK")
  end

  it 'gets a push to an unlicensed repo, responds with 200 OK' do
    payload = { repository: { name: 'no-cla-here', owner: { name: 'wyattearp', email: 'codeslinger@gmail.com' } } }
    post '/repo_hook', { payload: payload.to_json }, 'HTTP_X_GITHUB_EVENT' => 'push'
    expect(response.code).to eq("200")
    expect(response.body).to eq("OK")
  end

  it 'gets a push with 1 commit, where the author has agreed, and marks the commit as success' do
    user = create(:user, email: 'jason@gmail.com', nickname: 'jasonm', oauth_token: token)
    license = create(:license, user: user, repo_name: 'mangostickyrice')
    create(:agreement, user: user, license: license)

    payload = {
      repository: { name: 'mangostickyrice', owner: { name: 'jasonm', email: 'jason@gmail.com' } },
      commits: [ { id: 'aaa111', author: { name: 'Jason', username: 'jasonm', email: 'jason@gmail.com' } } ]
    }
    post '/repo_hook', { payload: payload.to_json }, 'HTTP_X_GITHUB_EVENT' => 'push'

    status_url = "https://api.github.com/repos/jasonm/mangostickyrice/statuses/aaa111?access_token=#{token}"
    status_params = {
      state: 'success',
      target_url: "#{HOST}/licenses/jasonm/mangostickyrice",
      description: 'They signed the Contributor License Agreement.'
    }
    expect(a_request(:post, status_url).with(body: status_params.to_json)).to have_been_made
  end

  it 'gets a push with 1 commit, where the author has NOT agreed, and marks the commit as failure' do
    user = create(:user, email: 'jason@gmail.com', nickname: 'jasonm', oauth_token: token)
    license = create(:license, user: user, repo_name: 'mangostickyrice')

    payload = {
      repository: { name: 'mangostickyrice', owner: { name: 'jasonm', email: 'jason@gmail.com' } },
      commits: [ { id: 'aaa111', author: { name: 'Jason', username: 'jasonm', email: 'jason@gmail.com' } } ]
    }
    post '/repo_hook', { payload: payload.to_json }, 'HTTP_X_GITHUB_EVENT' => 'push'

    status_url = "https://api.github.com/repos/jasonm/mangostickyrice/statuses/aaa111?access_token=#{token}"
    status_params = {
      state: 'failure',
      target_url: "#{HOST}/licenses/jasonm/mangostickyrice",
      description: 'They have not signed the Contributor License Agreement.'
    }
    expect(a_request(:post, status_url).with(body: status_params.to_json)).to have_been_made
  end

  it 'gets a push, where the committer has NOT agreed, and marks the commit as failure'
  it 'gets a push with many commits, where the single author has agreed, and marks all commits as success'
  it 'gets a push with many commits, where multiple authors all agreed, and marks the commit as success'
  it 'gets a push with many commits, where some authors agreed and others did not, and marks each commit correctly'

  it 'updates applicable "failure" commit statuses to "success" when a user agrees to a new license'
end
