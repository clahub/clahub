class ReposController < ApplicationController
  def index
    @repos = GithubRepos.new(current_user).repos
  end
end
