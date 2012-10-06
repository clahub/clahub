require 'spec_helper'

feature "Creating a CLA for a repo" do
  let(:token) { 'abc123' }
  let(:resulting_github_repo_hook_id) { 2345 }

  background do
    mock_github_oauth(
      credentials: { token: token },
      info: { nickname: 'jasonm' }
    )

    mock_github_user_repos(
      oauth_token: token,
      repos: [
        { name: 'alpha', id: 123, owner: { login: 'jasonm' } },
        { name: 'beta',  id: 456, owner: { login: 'jasonm' } }
      ]
    )

    mock_github_repo_hook({
      user_name: 'jasonm',
      repo_name: 'beta',
      oauth_token: token,
      resulting_hook_id: resulting_github_repo_hook_id
    })
  end


  scenario "Create an agreement for a public repo you own" do
    visit '/'
    click_link 'Sign in with GitHub to get started'
    page.should have_content('Welcome, Jason Morrison (jasonm - 12345)!')
    page.should have_content("Choose a repo to add an agreement to")
    page.should have_content("jasonm/alpha")
    page.should have_content("jasonm/beta")

    click_link 'jasonm/beta'
    page.should have_content('Choose a Contributor License Agreement for beta')

    fill_in :agreement, with: 'As a contributor, I assign copyright to the organization.'
    click_button 'Create agreement'

    page.should have_content('Your Contributor License Ageement for beta is ready.')
    page.should have_content('jasonm')
    page.should have_content('beta')
    page.should have_content('As a contributor, I assign copyright to the organization.')

    visit '/agreements/jasonm/beta'
    page.should have_content('As a contributor, I assign copyright to the organization.')

    visit '/sign_out'
    visit '/agreements/jasonm/beta'
    page.should have_content('As a contributor, I assign copyright to the organization.')
  end

  scenario "Sign up for commit notifications when an agreement is created" do
    visit '/'
    click_link 'Sign in with GitHub to get started'
    click_link 'jasonm/beta'
    fill_in :agreement, with: 'As a contributor, I assign copyright to the organization.'
    click_button 'Create agreement'

    inputs = {
      'name' => 'web',
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    a_request(:post, "https://api.github.com/repos/jasonm/beta/hooks?access_token=#{token}").with(body: inputs.to_json).should have_been_made

    expect(Agreement.last.github_repo_hook_id).to eq(resulting_github_repo_hook_id)
  end

  context "error handling" do
    scenario "Require agreement text to be entered" do
      visit '/'
      click_link 'Sign in with GitHub to get started'
      click_link 'jasonm/beta'
      fill_in :agreement, with: ''
      click_button 'Create agreement'

      page.should have_content("Text can't be blank")
    end

    scenario "only lets you create one agreement per repo"
    scenario "handles gracefully if you decline github oauth"
    scenario "handles gracefully if github returns an error response for repos"
    scenario "handles gracefully if github returns an error response for creating a repo hook"
  end

  scenario "Encourage owner to include a link to this CLA from your CONTRIBUTING file"
  scenario "Encourage owner to include a link to this CLA from your CONTRIBUTING.md file"
  scenario "Create an agreement for a repo you admin but do not directly own"
end
