require 'spec_helper'

describe "signing up from the home page" do
  it "lets you sign in with GitHub OAuth" do
    mock_github_oauth({
      :uid => '12345',
      :info => {
        :email => "jason.p.morrison@gmail.com",
        :name => "Jason Morrison",
        :nickname => 'jasonm'
      }
    })

    visit '/'
    click_link 'Sign in with GitHub to get started'
    page.should have_content('Welcome, Jason Morrison (jasonm - 12345)!')
  end
end
