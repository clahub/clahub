require 'spec_helper'

describe User do
  it { should have_many :agreements }
  it { should have_many :signatures }

  context "when looked up with a GitHub OAuth callback hash" do
    it "can be found by uid" do
      existing_user = create(:user, uid: 12345)
      lookup_user = User.find_or_create_for_github_oauth({ uid: '12345' })
      expect(lookup_user).to eq(existing_user)
    end

    it "updates with the most recent information" do
      existing_user = create(:user, {
        uid: '12345',
        nickname: 'oldnick',
        oauth_token: 'oldtoken',
        name: 'Old Name',
        email: 'old@email.com'
      })

      lookup_user = User.find_or_create_for_github_oauth({
        name: 'Jason Morrison',
        nickname: 'jasonm',
        uid: '12345',
        oauth_token: 'token-abc123',
        email: 'jason@example.com'
      })

      expect(lookup_user).to eq(existing_user.reload)
      expect(existing_user.name).to eq('Jason Morrison')
      expect(existing_user.nickname).to eq('jasonm')
      expect(existing_user.oauth_token).to eq('token-abc123')
      expect(existing_user.email).to eq('jason@example.com')
    end
  end

  it "finds a user by email or nickname" do
    alice = create(:user, email: 'alice@email.com', nickname: 'alpha')

    expect(User.find_by_email_or_nickname(nil, 'alpha')).to eq(alice)
    expect(User.find_by_email_or_nickname('alice@email.com', nil)).to eq(alice)
    expect(User.find_by_email_or_nickname(nil, 'nunchuks')).to eq(nil)
  end
end
