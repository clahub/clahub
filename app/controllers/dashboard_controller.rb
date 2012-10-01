class DashboardController < ApplicationController
  def show
    session[:redirect_after_github_oauth_url] = repos_url
  end
end
