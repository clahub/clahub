require 'spec_helper'

feature "Agreeing to a CLA" do
  let(:owner) { create(:user, nickname: 'the_owner') }

  background do
    create(:agreement, user: owner, repo_name: 'the_project', text: "The CLA *text*")
  end

  scenario "Prompt a user to log in via GitHub to agree to a CLA" do
    visit '/agreements/the_owner/the_project'
    page.should have_content('The CLA text')
    page.should have_content('Sign in with GitHub to agree to this CLA')
    page.should have_no_content('I agree')
  end

  scenario "Agreement text is rendered as markdown" do
    visit '/agreements/the_owner/the_project'
    page.body.should include("The CLA <em>text</em>")
  end

  scenario "Allow a user to sign in with GitHub and agree to a CLA" do
    mock_github_limited_oauth(info: { nickname: 'jasonm' })
    visit '/agreements/the_owner/the_project'
    click_link 'Sign in with GitHub to agree to this CLA'

    page.should have_content('The CLA text')
    page.should have_no_content('Sign in with GitHub')
    page.should have_content('I agree')

    click_button 'I agree'
    page.should have_content('You have agreed to the CLA for the_owner/the_project.')
  end

  scenario 'Prompts signee to fill in all fields' do
    agreement = Agreement.last

    Field.create({ label: 'Email', enabled_by_default: true, data_type: 'string' })
    Field.create({ label: 'Name', enabled_by_default: true, data_type: 'string' })
    Field.create({ label: 'Favorite Ice Cream', enabled_by_default: false, data_type: 'string' })

    agreement.build_default_fields
    agreement.save

    mock_github_limited_oauth(info: { nickname: 'jasonm' })
    visit '/agreements/the_owner/the_project'
    click_link 'Sign in with GitHub to agree to this CLA'

    page.should have_content('The CLA text')
    find_field('Email').should be
    find_field('Name').should be

    click_button 'I agree'

    page.should have_content("Name can't be blank")
    page.should have_content("Email can't be blank")

    fill_in 'Email', with: 'jason.p.morrison@gmail.com'
    fill_in 'Name', with: 'Jason Morrison'

    click_button 'I agree'
    page.should have_content('You have agreed to the CLA for the_owner/the_project.')
  end

  scenario "Do not allow me to agree twice" do
    mock_github_limited_oauth(info: { nickname: 'jasonm' })
    visit '/agreements/the_owner/the_project'
    click_link 'Sign in with GitHub to agree to this CLA'

    page.should have_content('The CLA text')
    page.should have_no_content('Sign in with GitHub')
    page.should have_content('I agree')

    click_button 'I agree'
    page.should have_content('You have agreed to the CLA for the_owner/the_project.')
    page.should have_no_content('I agree')
  end

  # this should go in some other spec
  scenario "Signing the agreement updates commit statuses for pull requests I've issued" do
    CheckOpenPullsJob.enabled = true

    create(:agreement, user: owner, user_name: 'the_owner', repo_name: 'alpha')
    create(:agreement, user: owner, user_name: 'the_owner', repo_name: 'beta')

    mock_github_user_repos(oauth_token: oauth_token_for('the_owner'),
      repos: [
        { name: 'alpha', id: 123, owner: { login: 'the_owner' } },
        { name: 'beta',  id: 456, owner: { login: 'the_owner' } }
      ]
    )

    mock_github_open_pulls(owner: 'the_owner', repo: 'alpha', pull_ids: [1, 2])
    mock_github_open_pulls(owner: 'the_owner', repo: 'beta',  pull_ids: [1])

    mock_github_pull_commits(
      owner: 'the_owner', repo: 'alpha', pull_id: '1',
      commits: [
        { author: { login: 'carlisle_contributor' }, sha: 'aaa111' }
      ]
    )

    mock_github_pull_commits(
      owner: 'the_owner', repo: 'alpha', pull_id: '2',
      commits: [
        { author: { login: 'carlisle_contributor' }, sha: 'bbb222' },
        { author: { login: 'nancy_no_signature' }, sha: 'ccc333' },
      ]
    )

    mock_github_pull_commits(
      owner: 'the_owner', repo: 'beta', pull_id: '1',
      commits: [
        { author: { login: 'nancy_no_signature' }, sha: 'ddd444' },
        { author: { login: 'carlisle_contributor' }, committer: { login: 'caterina_committer' }, sha: 'eee555' }
      ]
    )

    mock_github_set_commit_status({ user_name: 'the_owner', repo_name: 'alpha', sha: 'aaa111' })
    mock_github_set_commit_status({ user_name: 'the_owner', repo_name: 'alpha', sha: 'bbb222' })
    mock_github_set_commit_status({ user_name: 'the_owner', repo_name: 'alpha', sha: 'ccc333' })
    mock_github_set_commit_status({ user_name: 'the_owner', repo_name: 'beta',  sha: 'ddd444' })
    mock_github_set_commit_status({ user_name: 'the_owner', repo_name: 'beta',  sha: 'eee555' })

    sign_agreement('the_owner', 'alpha', 'carlisle_contributor')
    sign_agreement('the_owner', 'beta', 'carlisle_contributor')

    expect_commit_status_to_be_set('the_owner', 'alpha', 'aaa111', 'success')
    expect_commit_status_to_be_set('the_owner', 'alpha', 'bbb222', 'success')
    expect_commit_status_to_be_set('the_owner', 'alpha', 'ccc333', 'failure')
    expect_commit_status_to_be_set('the_owner', 'beta',  'ddd444', 'failure')
    expect_commit_status_to_be_set('the_owner', 'beta',  'eee555', 'failure')

    sign_agreement('the_owner', 'beta', 'caterina_committer')
    expect_commit_status_to_be_set('the_owner', 'beta',  'eee555', 'success')
  end

  def expect_commit_status_to_be_set(user_name, repo_name, sha, status)
    raise "no agreement made for repo" unless agreement = Agreement.find_by_user_name_and_repo_name(user_name, repo_name)
    raise "no oauth token for creator" unless oauth_token = agreement.user.oauth_token

    status_url = "https://api.github.com/repos/#{user_name}/#{repo_name}/statuses/#{sha}?access_token=#{oauth_token}"
    status_params = {
      state: status,
      target_url: "#{HOST}/agreements/#{user_name}/#{repo_name}",
      description: PushStatusChecker::STATUS_DESCRIPTIONS[status],
      context: "clahub"
    }

    expect(a_request(:post, status_url).with(body: status_params.to_json)).to have_been_made
  end

  def sign_agreement(repo_owner, repo_name, contributor_nickname)
    unless Agreement.find_by_user_name_and_repo_name(repo_owner, repo_name)
      raise "no agreement for #{repo_owner}/#{repo_name} for #{contributor_nickname} to sign"
    end

    github_uid ||= github_uid_for_nickname(contributor_nickname)
    mock_github_limited_oauth(info: { nickname: contributor_nickname }, uid: github_uid)

    visit '/sign_out'
    visit "/agreements/#{repo_owner}/#{repo_name}"
    click_link 'Sign in with GitHub to agree to this CLA'
    click_button 'I agree'
  end
end
