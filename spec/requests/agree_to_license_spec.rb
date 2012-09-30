require 'spec_helper'

describe "agreeing to a CLA for a repo" do
  before do
    mock_github_oauth(info: { nickname: 'jasonm' })
    owner = create(:user, nickname: 'the_owner')
    license = create(:license, user: owner, repo_name: 'the_project', text: "The CLA text")
  end

  it "prompts a user to log in via GitHub to agree to a CLA" do
    visit '/licenses/the_owner/the_project'
    page.should have_content('The CLA text')
    page.should have_content('Sign in with GitHub to agree to this CLA')
    page.should have_no_content('I agree')
  end

  it "allows a user to sign in with GitHub and agree to a CLA" do
    visit '/licenses/the_owner/the_project'
    click_link 'Sign in with GitHub to agree to this CLA'

    page.should have_content('The CLA text')
    page.should have_no_content('Sign in with GitHub')
    page.should have_content('I agree')

    click_link 'I agree'
    page.should have_content('You have agreed to the CLA for the_owner/the_project.')
  end

  it "shows me who has agreed to the license" do
    visit '/licenses/the_owner/the_project'
    click_link 'Sign in with GitHub to agree to this CLA'
    click_link 'I agree'

    visit '/sign_out'

    visit '/licenses/the_owner/the_project'
    page.should have_content('have agreed to the CLA')
    page.should have_content('jasonm')
  end
end
