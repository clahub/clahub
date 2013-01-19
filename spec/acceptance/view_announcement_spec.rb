require 'spec_helper'

feature 'Seeing an announcement' do
  it 'shows the announcement on the page' do
    Announcement.create(body: 'Welcome one, welcome all!')
    visit '/'
    page.should have_content('Welcome one, welcome all!')
  end
end
