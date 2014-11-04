require 'spec_helper'

describe Agreement do
  it { should validate_presence_of :text }
  it { should belong_to :user }
  it { should have_many :signatures }
  it { should have_many :agreement_fields }
  it { should have_many :fields }
  it { should have_many :repositories }

  it "validates user/repo can be added to one agreement only" do
    user = create(:user, nickname: 'alice')
    first = build(:agreement, user: user)
    first.repositories << create(:repository, user_name: user.nickname, repo_name: 'alpha', agreement: first)
    first.save
    
    second = build(:agreement, user: user)
    invalid_repository = build(:repository, user_name: user.nickname, repo_name: 'alpha', agreement: second)
    repo_with_error = invalid_repository.dup
    repo_with_error.save
    second.repositories << repo_with_error
    second.save

    expect(invalid_repository).to_not be_valid
    expect(repo_with_error.errors[:repo_name]).to include('has already been taken')

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

  it { should allow_mass_assignment_of(:repositories) }
  it { should allow_mass_assignment_of(:text) }
  it { should allow_mass_assignment_of(:agreement_fields_attributes) }
  it { should_not allow_mass_assignment_of(:user_id) }

  it "knows who owns it" do
    owner = build(:user)
    non_owner = build(:user)
    agreement = build(:agreement, user: owner)

    expect(agreement.owned_by?(owner)).to be_truthy
    expect(agreement.owned_by?(non_owner)).to be_falsey
  end

  it "knows who signed it" do
    signee = create(:user)
    non_signee = create(:user)
    agreement = create(:agreement)
    create(:signature, agreement: agreement, user: signee)

    expect(agreement.signed_by?(signee)).to be_truthy
    expect(agreement.signed_by?(non_signee)).to be_falsey
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
