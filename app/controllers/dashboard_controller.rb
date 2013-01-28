class DashboardController < ApplicationController
  def show
    @suppress_navbar = true
    session[:redirect_after_github_oauth_url] = new_agreement_url
  end

  def why_cla
  end
end
