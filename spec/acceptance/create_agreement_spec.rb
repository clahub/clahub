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
    page.should have_content('Welcome, Jason Morrison (jasonm)!')
    page.should have_content("Choose a project and your agreement")
    page.should have_content("jasonm/alpha")
    page.should have_content("jasonm/beta")

    select 'jasonm/beta', from: 'user-name-repo-name'
    fill_in :agreement, with: 'As a contributor, I assign copyright to the organization.'
    click_button 'Create agreement'

    page.should have_content('Your Contributor License Ageement for jasonm/beta is ready.')
    page.should have_content('jasonm')
    page.should have_content('beta')
    page.should have_content('As a contributor, I assign copyright to the organization.')

    suggested_content_for_contributing_file = %[<a href="#{HOST}/agreements/jasonm/beta">sign the Contributor License Agreement</a>.]
    page.should have_content(suggested_content_for_contributing_file)

    visit '/agreements/jasonm/beta'
    page.should have_content('As a contributor, I assign copyright to the organization.')

    visit '/sign_out'
    visit '/agreements/jasonm/beta'
    page.should have_content('As a contributor, I assign copyright to the organization.')
  end

  scenario "Sign up for commit notifications when an agreement is created" do
    visit '/'
    click_link 'Sign in with GitHub to get started'

    select 'jasonm/beta', from: 'user-name-repo-name'
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

  scenario "Encourage owner to include a link to this CLA from your CONTRIBUTING file" do
    visit '/'
    click_link 'Sign in with GitHub to get started'

    select 'jasonm/beta', from: 'user-name-repo-name'
    fill_in :agreement, with: 'As a contributor, I assign copyright to the organization.'
    click_button 'Create agreement'

    page.should have_content("Link from your contributing guidelines")
  end

  scenario "Preview markdown formatting for your agreement text", js: true do
    visit '/'
    click_link 'Sign in with GitHub to get started'

    select 'jasonm/beta', from: 'user-name-repo-name'
    fill_in :agreement, with: 'As a contributor, I assign copyright to the organization.'

    markdown_source = '![](http://images.com/img.jpg) _markdown test_'
    expected_html = '<p><img src="http://images.com/img.jpg" alt=""> <em>markdown test</em></p>'

    page.first("div#preview-agreement div.preview", visible: true).should be_nil

    fill_in :agreement, with: markdown_source
    click_link "Preview"

    page.find("div#preview-agreement div.preview", visible: true).should be_present
    page.body.should include(expected_html)
  end

  context "error handling" do
    background do
      visit '/'
      click_link 'Sign in with GitHub to get started'
    end

    scenario "Require agreement text to be entered" do
      select 'jasonm/beta', from: 'user-name-repo-name'
      fill_in :agreement, with: ''
      click_button 'Create agreement'

      page.should have_content("Text can't be blank")
    end

    scenario 'Require repo to be chosen' do
      fill_in :agreement, with: ''
      click_button 'Create agreement'

      page.should have_content("Repo name can't be blank")
    end

    scenario "only lets you create one agreement per repo" do
      select 'jasonm/beta', from: 'user-name-repo-name'
      fill_in :agreement, with: 'Be awesome'
      click_button 'Create agreement'

      visit '/agreements/new'
      select 'jasonm/beta', from: 'user-name-repo-name'
      fill_in :agreement, with: 'Be awesome'
      click_button 'Create agreement'

      page.should have_content("An agreement already exists for jasonm/beta")
    end

    scenario "handles gracefully if github returns an error response for repos"
    scenario "handles gracefully if github returns an error response for creating a repo hook"
  end


  scenario "Detect when owner has included link to CLA from CONTRIBUTING/CONTRIBUTING.md file"
  scenario "Create an agreement for a repo you admin but do not directly own"
  scenario "Creating an agreement updates commit statuses open for pull requests"
end

feature "Failing GitHub OAuth" do
  scenario "It gracefully fails if you decline GitHub OAuth" do
    mock_github_oauth_failure
    visit '/'
    click_link 'Sign in with GitHub to get started'

    page.should have_content("You'll need to sign into GitHub.")
  end
end
