require 'spec_helper'

describe User do
  it { should have_many :agreements }

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
end
