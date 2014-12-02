require 'spec_helper'

feature 'Deleting an agreement' do

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

    page.should have_content('Users who have signed:')
    page.should have_content('alice')
    page.should have_content('Delete this agreement')
    page.find("#delete-agreement-button", match: :first).click

    page.should have_content('Are you sure you would like to delete this agreement?')
    page.should have_content('No, do not delete')
    page.should have_content('Yes, delete this agreement')

    Signature.count.should == 4
    Agreement.count.should == 4
    page.find("#confirm-delete", match: :first).click

    page.should have_content('You have deleted the agreement jasonm/jelly')

    Signature.count.should == 3
    Agreement.count.should == 3

    visit '/agreements'
    page.should have_no_content('jasonm/jelly')
  end
end
