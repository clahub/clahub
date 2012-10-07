class DashboardController < ApplicationController
  def show
    session[:redirect_after_github_oauth_url] = new_agreement_url
  end
end
