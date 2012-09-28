require 'spec_helper'

describe "splash page" do
  it "has an explanation" do
    visit '/'
    page.should have_content('Contributor License Agreement')
    page.should have_content('GitHub')
  end
end
