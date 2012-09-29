class DashboardController < ApplicationController
  def show
    if signed_in?
      @repos = github.repos.list
      render 'show'
    else
      render 'splash'
    end
  end

  private

  def github
    @github ||= Github.new(oauth_token: current_user.oauth_token)
  end
end
