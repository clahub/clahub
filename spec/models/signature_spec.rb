require 'spec_helper'

describe Signature do
  it { should belong_to :user }
  it { should belong_to :agreement }

  it { should validate_presence_of :user_id }
  it { should validate_presence_of :agreement_id }

  it { should allow_mass_assignment_of(:user) }
  it { should allow_mass_assignment_of(:agreement) }

  it "tells its agreement to re-check open pulls" do
    agreement = create(:agreement, user_name: 'the_owner', repo_name: 'the_repo')
    agreement.stub(check_open_pulls: true)

    agreement.should_receive(:check_open_pulls).with()

    create(:signature, agreement: agreement)
  end
end
