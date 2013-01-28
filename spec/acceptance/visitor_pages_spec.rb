require 'spec_helper'

feature "Splash page" do
  scenario "Explains the site to a visitor" do
    visit '/'
    page.should have_content('Contributor License Agreement')
    page.should have_content('GitHub')
  end
end

feature "The 'Why CLAs?' page" do
  scenario 'Explains CLAs to a visitor' do
    visit '/'
    click_link 'what CLAs are'
    page.should have_content('What is a CLA')
  end
end
