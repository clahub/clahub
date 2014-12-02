require 'spec_helper'

feature 'Viewing signatures for an agreement' do
  background do
    Field.create({ label: 'Email', enabled_by_default: true, data_type: 'string' })

    owner = create(:user, nickname: 'oswald_owner', uid: 1)
    agreement = build(:agreement, user: owner, repo_name: 'the_project', text: "The CLA text")
    agreement.build_default_fields
    agreement.save!

    signee = create(:user, nickname: 'sally_signee', name: 'Sally Signee', uid: 2)
    signature = build(:signature, user: signee, agreement: agreement)
    signature.field_entries.build({ signature: signature, agreement_field: agreement.agreement_fields.first, value: "a@b.com" })
    signature.save!
  end

  scenario 'The repo owner may view signatures for an agreement' do
    view_license_as('oswald_owner')

    expect(page).to have_content('The CLA text')
    expect(page).to have_content('Users who have signed')
    expect(page).to have_content('sally_signee')
  end

  scenario 'The repo owner may download a CSV of signatures' do
    view_license_as('oswald_owner')
    click_link 'Download CSV'
    expect(page).to have_content('sally_signee')
    expect(page).to have_content('Sally Signee')
    expect(page).to have_content('a@b.com')
  end

  scenario 'A non-owner may not download a CSV of signatures' do
    view_license_as('sally_signee')
    expect(page).to have_no_content('Download CSV')
    visit '/agreements/oswald_owner/the_project.csv'
    page.status_code.should == 404
  end

  scenario 'A signee can see that they have signed an agreement' do
    view_license_as('sally_signee')

    expect(page).to have_content('The CLA text')
    expect(page).to have_no_content('Users who have signed')
    expect(page).to have_content('You have signed this CLA')
  end

  scenario 'Other users may not view signatures for an agreement' do
    view_license_as('bobby_bubblegum')

    expect(page).to have_content('The CLA text')
    expect(page).to have_no_content('Users who have signed')
    expect(page).to have_no_content('You have signed this CLA')
  end

  scenario 'Any github user who admins the repo may view signatures for an agreement'

  def view_license_as(github_nickname, github_uid = nil)
    github_uid ||= github_uid_for_nickname(github_nickname)

    mock_github_limited_oauth(info: { nickname: github_nickname }, uid: github_uid)
    visit '/sign_out'
    visit '/agreements/oswald_owner/the_project'
    click_link 'Sign in with GitHub to agree to this CLA'
  end
end
