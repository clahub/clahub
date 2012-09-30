require 'spec_helper'

describe License do
  it { should validate_presence_of :user_name }
  it { should validate_presence_of :repo_name }
  it { should validate_presence_of :text }
  it { should belong_to :user }
  it { should have_many :agreements }

  it "has many agreeing users through agreements" do
    user = create(:user)
    user2 = create(:user)
    license = create(:license)
    create(:agreement, user: user, license: license)
    create(:agreement, user: user2, license: license)

    expect(license.agreeing_users).to eq([user, user2])
  end

  it { should allow_mass_assignment_of(:repo_name) }
  it { should allow_mass_assignment_of(:text) }
  it { should_not allow_mass_assignment_of(:user_name) }
  it { should_not allow_mass_assignment_of(:user_id) }


  it "sets user_name" do
    user = build(:user, nickname: "jimbo")
    license = build(:license, user: user)

    license.save

    expect(license.user_name).to eq("jimbo")
    expect(license.reload.user_name).to eq("jimbo")
  end
end
