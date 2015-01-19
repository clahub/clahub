require 'spec_helper'

describe Agreement do
  it { should validate_presence_of :user_name }
  it { should validate_presence_of :repo_name }
  it { should validate_presence_of :text }
  it { should belong_to :user }
  it { should have_many :signatures }
  it { should have_many :agreement_fields }
  it { should have_many :fields }

  it "validates one agreement per user/repo" do
    user = create(:user, nickname: 'alice')
    first = create(:agreement, user: user, repo_name: 'alpha')
    second = build(:agreement, user: user, repo_name: 'alpha')

    expect(second).to_not be_valid
    expect(second.errors[:base]).to include('An agreement already exists for alice/alpha')

    expect(first).to be_valid
  end

  it "has many signing_users through signatures" do
    user = create(:user)
    user2 = create(:user)
    agreement = create(:agreement)
    create(:signature, user: user, agreement: agreement)
    create(:signature, user: user2, agreement: agreement)

    expect(agreement.signing_users).to eq([user, user2])
  end

  it { should allow_mass_assignment_of(:repo_name) }
  it { should allow_mass_assignment_of(:text) }
  it { should allow_mass_assignment_of(:user_name) }
  it { should allow_mass_assignment_of(:agreement_fields_attributes) }
  it { should_not allow_mass_assignment_of(:user_id) }

  it "sets user_name" do
    user = build(:user, nickname: "jimbo")
    agreement = build(:agreement, user: user)

    agreement.save

    expect(agreement.user_name).to eq("jimbo")
    expect(agreement.reload.user_name).to eq("jimbo")
  end

  it "create a github repo hook" do
    agreement = build(:agreement)

    hook_inputs = {
      'name' => 'web',
      'events' => ['push', 'pull_request'],
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    github_repos = double(create_hook: { 'id' => 12345 })
    GithubRepos.stub(new: github_repos)

    github_repos.should_receive(:create_hook).with(agreement.user_name, agreement.repo_name, hook_inputs)
    GithubRepos.should_receive(:new).with(agreement.user)

    agreement.create_github_repo_hook

    expect(agreement.github_repo_hook_id).to eq(12345)
  end

  it "can delete its github repo hook" do
    agreement = build(:agreement, github_repo_hook_id: 7890)

    hook_inputs = {
      'name' => 'web',
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    github_repos = double(delete_hook: nil) # on not-found, raises Github::Error::NotFound
    GithubRepos.stub(new: github_repos)

    github_repos.should_receive(:delete_hook).with(agreement.user_name, agreement.repo_name, agreement.github_repo_hook_id)
    GithubRepos.should_receive(:new).with(agreement.user)

    agreement.delete_github_repo_hook
    expect(agreement.github_repo_hook_id).to be_nil
  end

  it "deletes its signature, github repo hook, and self during #destroy_including_signatures_and_hook" do
    agreement = build(:agreement, github_repo_hook_id: 7890)

    hook_inputs = {
      'name' => 'web',
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    github_repos = double(delete_hook: nil) # on not-found, raises Github::Error::NotFound
    GithubRepos.stub(new: github_repos)
    github_repos.should_receive(:delete_hook).with(agreement.user_name, agreement.repo_name, agreement.github_repo_hook_id)

    signature = stub(destroy: true)
    agreement.stub(signatures: [signature])
    signature.should_receive(:destroy)

    agreement.destroy_including_signatures_and_hook
  end

  it "knows who owns it" do
    owner = build(:user)
    non_owner = build(:user)
    agreement = build(:agreement, user: owner)

    expect(agreement.owned_by?(owner)).to be_true
    expect(agreement.owned_by?(non_owner)).to be_false
  end

  it "knows who signed it" do
    signee = create(:user)
    non_signee = create(:user)
    agreement = create(:agreement)
    create(:signature, agreement: agreement, user: signee)

    expect(agreement.signed_by?(signee)).to be_true
    expect(agreement.signed_by?(non_signee)).to be_false
  end

  it "checks on open pull reqs for its repo when told" do
    owner = create(:user, nickname: 'the_owner')
    job = stub('update commit status on open pull requests job', run: true)
    CheckOpenPullsJob.stub(:new => job)

    CheckOpenPullsJob.should_receive(:new).with(owner: owner, repo_name: 'the_repo', user_name: 'the_owner')
    job.should_receive(:run).with()

    agreement = build(:agreement, user: owner, repo_name: 'the_repo')
    agreement.check_open_pulls
  end

  context "with some fields" do
    before do
      Field.create({ label: 'Email', enabled_by_default: true, data_type: 'string' })
      Field.create({ label: 'Name', enabled_by_default: true, data_type: 'string' })
      Field.create({ label: 'Favorite Ice Cream', enabled_by_default: false, data_type: 'string' })
    end

    it "build default fields" do
      agreement = create(:agreement)
      agreement.fields.length.should == 0

      agreement.build_default_fields
      agreement.agreement_fields.length.should == 3

      # no dupes on re-build
      agreement.build_default_fields
      agreement.agreement_fields.length.should == 3

      agreement.reload
      agreement.agreement_fields.length.should == 0
    end

    it "has some enabled agreement fields and some disabled" do
      agreement = build(:agreement)
      agreement.build_default_fields
      agreement.save
      agreement.reload

      agreement.enabled_agreement_fields.length.should == 2
    end
  end
end
