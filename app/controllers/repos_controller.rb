class ReposController < ApplicationController
  def index
    @repos = github.repos.list.sort_by(&:name)
  end

  private

  def github
    @github ||= Github.new(oauth_token: current_user.oauth_token)
  end
end
