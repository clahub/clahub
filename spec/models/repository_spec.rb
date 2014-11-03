require 'spec_helper'

describe Repository do
  it { should belong_to :agreement }
  it { should validate_presence_of :repo_name }
  it { should validate_presence_of :user_name }
  it { should validate_uniqueness_of(:repo_name).scoped_to(:user_name) }
  it { should allow_mass_assignment_of(:github_repo_hook_id) }
  it { should allow_mass_assignment_of(:agreement_id) }
  it { should allow_mass_assignment_of(:repo_name) }
  it { should allow_mass_assignment_of(:user_name) }
  
  it "sets user_name" do
    user = build(:user, nickname: "jimbo")
    agreement = create(:agreement, user: user)
    repository = create(:repository, agreement: agreement)

    expect(agreement.repositories.collect(&:user_name)).to include("jimbo")
  end

  it "create a github repo hook" do
    agreement = create(:agreement)
    repository = create(:repository, agreement: agreement)

    hook_inputs = {
      'name' => 'web',
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    github_repos = double(create_hook: { 'id' => 12345 })
    GithubRepos.stub(new: github_repos)

    github_repos.should_receive(:create_hook).with(repository.user_name, repository.repo_name, hook_inputs)
    GithubRepos.should_receive(:new).with(repository.agreement.user)

    repository.create_github_repo_hook

    expect(repository.github_repo_hook_id).to eq(12345)
  end

  it "can delete its github repo hook" do
    agreement = build(:agreement)
    repository = create(:repository, agreement: agreement, github_repo_hook_id: 7890)

    hook_inputs = {
      'name' => 'web',
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    github_repos = double(delete_hook: nil) # on not-found, raises Github::Error::NotFound
    GithubRepos.stub(new: github_repos)

    github_repos.should_receive(:delete_hook).with(repository.user_name, repository.repo_name, repository.github_repo_hook_id)
    GithubRepos.should_receive(:new).with(repository.agreement.user)

    repository.delete_github_repo_hook
    expect(repository.github_repo_hook_id).to be_nil
  end
  
  it "checks on open pull reqs for its repo when told" do
    owner = create(:user, nickname: 'the_owner')
    job = double('update commit status on open pull requests job', run: true)
    CheckOpenPullsJob.stub(:new => job)

    CheckOpenPullsJob.should_receive(:new).with(owner: owner, repo_name: 'the_repo', user_name: 'the_owner')
    job.should_receive(:run).with()

    agreement = build(:agreement, user: owner)
    repository = create(:repository, agreement: agreement, repo_name: 'the_repo')
    repository.check_open_pulls
  end
end
