require 'spec_helper'

feature 'Changing agreement ownership' do

  scenario 'as a signed in user with agreements and signatures', js: true do
    jasonm = create(:user, nickname: 'jasonm')
    alice = create(:user, nickname: 'alice')

    create(:agreement, user: jasonm, user_name: 'jasonm', repo_name: 'jam')
    create(:agreement, user: jasonm, user_name: 'jasonm', repo_name: 'jelly')
    create(:agreement, user: alice, user_name: 'alice', repo_name: 'anodyne')
    create(:agreement, user: alice, user_name: 'alice', repo_name: 'airmattress')

    create(:signature, user: jasonm, agreement: Agreement.find_by_user_name_and_repo_name('alice', 'anodyne'))
    create(:signature, user: jasonm, agreement: Agreement.find_by_user_name_and_repo_name('alice', 'airmattress'))
    create(:signature, user: alice, agreement: Agreement.find_by_user_name_and_repo_name('jasonm', 'jam'))
    create(:signature, user: alice, agreement: Agreement.find_by_user_name_and_repo_name('jasonm', 'jelly'))

    mock_github_limited_oauth(info: { nickname: 'jasonm' }, credentials: { token: 'token' }, uid: github_uid_for_nickname('jasonm'))
    mock_github_oauth(info: { nickname: 'jasonm' }, credentials: { token: 'token' }, uid: github_uid_for_nickname('jasonm'))
    mock_github_user_repos(oauth_token: 'token', repos: [])
    mock_github_user_orgs(oauth_token: 'token', orgs: [])

    visit '/'
    click_link 'Sign in with GitHub to get started'
    click_link 'My agreements and signatures'
    click_link 'jelly'

    page.should have_content('Transfer Agreement Ownership')
    page.select('alice', :from => 'agreement[user_id]')
    page.find("input.update", match: :first).click

    visit '/agreements'
    page.should have_no_content('jasonm/jelly')
  end
end
