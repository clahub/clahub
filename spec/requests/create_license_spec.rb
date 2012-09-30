require 'spec_helper'

describe "creating a license for a repo" do
  before do
    token = 'abc123'
    mock_github_oauth(
      credentials: { token: token },
      info: { nickname: 'jasonm' }
    )

    mock_user_repos(
      oauth_token: token,
      repos: [
        { name: 'alpha', id: 123, owner: { login: 'jasonm' } },
        { name: 'beta',  id: 456, owner: { login: 'jasonm' } }
      ]
    )
  end

  it "lets you create a license for a public repo you own" do
    visit '/'
    click_link 'Sign in with GitHub to get started'
    page.should have_content('Welcome, Jason Morrison (jasonm - 12345)!')
    page.should have_content("Choose a repo to add a license to")
    page.should have_content("jasonm/alpha")
    page.should have_content("jasonm/beta")

    click_link 'jasonm/beta'
    page.should have_content('Choose a Contributor License Agreement for beta')

    fill_in :license, with: 'As a contributor, I assign copyright to the organization.'
    click_button 'Create license'

    page.should have_content('Your Contributor License Ageement for beta is ready.')
    page.should have_content('jasonm')
    page.should have_content('beta')
    page.should have_content('As a contributor, I assign copyright to the organization.')

    visit '/licenses/jasonm/beta'
    page.should have_content('As a contributor, I assign copyright to the organization.')

    visit '/sign_out'
    visit '/licenses/jasonm/beta'
    page.should have_content('As a contributor, I assign copyright to the organization.')
  end

  it "requires license text to be entered" do
    visit '/'
    click_link 'Sign in with GitHub to get started'
    click_link 'jasonm/beta'
    fill_in :license, with: ''
    click_button 'Create license'

    page.should have_content("Text can't be blank")
  end

  it "encourages you to include a link to this CLA from your CONTRIBUTING file"
  it "encourages you to include a link to this CLA from your CONTRIBUTING.md file"
  it "lets you create a license for a repo you admin but are not the direct owner of"
end
