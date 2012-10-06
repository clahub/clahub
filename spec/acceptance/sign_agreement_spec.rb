require 'spec_helper'

feature "Agreeing to a CLA" do
  background do
    mock_github_oauth(info: { nickname: 'jasonm' })
    owner = create(:user, nickname: 'the_owner')
    agreement = create(:agreement, user: owner, repo_name: 'the_project', text: "The CLA text")
  end

  scenario "Prompt a user to log in via GitHub to agree to a CLA" do
    visit '/agreements/the_owner/the_project'
    page.should have_content('The CLA text')
    page.should have_content('Sign in with GitHub to agree to this CLA')
    page.should have_no_content('I agree')
  end

  scenario "Allow a user to sign in with GitHub and agree to a CLA" do
    visit '/agreements/the_owner/the_project'
    click_link 'Sign in with GitHub to agree to this CLA'

    page.should have_content('The CLA text')
    page.should have_no_content('Sign in with GitHub')
    page.should have_content('I agree')

    click_link 'I agree'
    page.should have_content('You have agreed to the CLA for the_owner/the_project.')
  end

  scenario "Do not allow me to agree twice" do
    visit '/agreements/the_owner/the_project'
    click_link 'Sign in with GitHub to agree to this CLA'

    page.should have_content('The CLA text')
    page.should have_no_content('Sign in with GitHub')
    page.should have_content('I agree')

    click_link 'I agree'
    page.should have_content('You have agreed to the CLA for the_owner/the_project.')
    page.should have_no_content('I agree')
  end

  scenario "Signing the agreement updates commit statuses for pull requests I've issued"
end
