require 'spec_helper'

describe "signing up from the home page" do
  it "lets you sign in with GitHub OAuth" do
    OmniAuth.config.test_mode = true
    OmniAuth.config.add_mock(:github, {
      :uid => '12345',
      :nickname => 'jasonm'
    })

    visit '/'
    click_link 'Sign in with GitHub to get started'

  end

  after do
    OmniAuth.config.test_mode = false
  end
end
