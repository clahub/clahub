require 'spec_helper'

describe GithubRepos do
  let(:user) { build(:user) }
  let(:repo1) { Hashie::Mash.new(name: 'repo1') }
  let(:repo2) { Hashie::Mash.new(name: 'repo2') }

  it 'fetches 1000 repos per page to avoid pagination' do
    expect(GithubRepos::REPOS_PER_PAGE).to eq(1000)
  end

  it 'wraps Github to find repos for a user, sorting them by name' do
    github = double(repos: double('repos', list: [repo2, repo1]))
    github.repos.should_receive(:list).with(per_page: GithubRepos::REPOS_PER_PAGE)

    Github.stub(new: github)
    Github.should_receive(:new).with(oauth_token: user.oauth_token)

    repos = GithubRepos.new(user).repos
    expect(repos).to eq([repo1, repo2])
  end

  it 'wraps Github to create a hook' do
    user_name = 'username'
    repo_name = 'reponame'
    hook_inputs = { 'a' => 'b' }

    github = double(repos: double('repos', hooks: double('hooks', create: true)))
    github.repos.hooks.should_receive(:create).with(user_name, repo_name, hook_inputs).and_return('id' => 12345)

    Github.stub(new: github)
    Github.should_receive(:new).with(oauth_token: user.oauth_token)

    response = GithubRepos.new(user).create_hook(user_name, repo_name, hook_inputs)
    expect(response).to eq({ 'id' => 12345 })
  end
end
