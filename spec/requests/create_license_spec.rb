require 'spec_helper'

describe "creating a license for a repo" do
  let(:token) { 'abc123' }
  let(:resulting_github_repo_hook_id) { 2345 }

  before do
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

  it "signs up for commit notifications when a license is created" do

    visit '/'
    click_link 'Sign in with GitHub to get started'
    click_link 'jasonm/beta'
    fill_in :license, with: 'As a contributor, I assign copyright to the organization.'
    click_button 'Create license'

    inputs = {
      'name' => 'web',
      'config' => {
        'url' => "#{HOST}/repo_hook"
      }
    }

    a_request(:post, "https://api.github.com/repos/jasonm/beta/hooks?access_token=#{token}").with(body: inputs.to_json).should have_been_made

    expect(License.last.github_repo_hook_id).to eq(resulting_github_repo_hook_id)
  end

  context "error handling" do
    it "requires license text to be entered" do
      visit '/'
      click_link 'Sign in with GitHub to get started'
      click_link 'jasonm/beta'
      fill_in :license, with: ''
      click_button 'Create license'

      page.should have_content("Text can't be blank")
    end

    it "only lets you create one license per repo"
    it "handles gracefully if you decline github oauth"
    it "handles gracefully if github returns an error response for repos"
    it "handles gracefully if github returns an error response for creating a repo hook"
  end

  it "encourages you to include a link to this CLA from your CONTRIBUTING file"
  it "encourages you to include a link to this CLA from your CONTRIBUTING.md file"
  it "lets you create a license for a repo you admin but are not the direct owner of"
end
