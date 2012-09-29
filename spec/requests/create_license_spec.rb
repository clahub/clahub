require 'spec_helper'

describe "creating a license for a repo" do
  it "lets you create a license for a public repo you own" do
    token = 'abc123'
    mock_github_oauth(credentials: { token: token })
    mock_user_repos(
      :oauth_token => token,
      :repos => [
        { "name" => "alpha", "id" => 123 },
        { "name" => "beta",  "id" => 456 }
      ]
    )

    visit '/'
    click_link 'Sign in with GitHub to get started'

    page.should have_content('Welcome, Jason Morrison (jasonm - 12345)!')
    page.should have_content("Choose a repo to add a license to")

    page.should have_content("alpha")
    page.should have_content("beta")
  end
end
