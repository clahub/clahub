require 'spec_helper'

feature 'Viewing my agreements and signatures' do

  scenario 'as a signed out user' do
    visit '/sign_out'
    page.should_not have_content('My agreements and signatures')
  end

  scenario 'as a signed in user with agreements and signatures' do
    jasonm = create(:user, nickname: 'jasonm')
    alice = create(:user, nickname: 'alice')

    create(:agreement, user: jasonm, user_name: 'jasonm', repo_name: 'jam')
    create(:agreement, user: jasonm, user_name: 'jasonm', repo_name: 'jelly')
    create(:agreement, user: alice, user_name: 'alice', repo_name: 'anodyne')
    create(:agreement, user: alice, user_name: 'alice', repo_name: 'airmattress')

    mock_github_oauth(info: { nickname: 'jasonm' }, credentials: { token: 'token' }, uid: github_uid_for_nickname('jasonm'))
    mock_github_user_repos(oauth_token: 'token', repos: [])
    mock_github_user_orgs(oauth_token: 'token', orgs: [])

    visit '/'
    click_link 'Sign in with GitHub to get started'
    click_link 'My agreements and signatures'
    page.should have_content 'jam'
    page.should have_content 'jelly'
    page.should_not have_content('anodyne')
    page.should_not have_content('airmattress')
    page.should have_content("You haven't signed any agreements.")

    create(:signature, user: jasonm, agreement: Agreement.find_by_user_name_and_repo_name('alice', 'anodyne'))
    create(:signature, user: jasonm, agreement: Agreement.find_by_user_name_and_repo_name('alice', 'airmattress'))
    click_link 'My agreements and signatures'
    page.should have_content('anodyne')
    page.should have_content('airmattress')
  end
end
