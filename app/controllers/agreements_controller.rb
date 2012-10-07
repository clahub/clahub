class AgreementsController < ApplicationController
  def new
    @agreement = current_user.agreements.new
    @repos = repos_for_current_user
  end

  def create
    split_user_name_repo_name

    @agreement = current_user.agreements.new(params[:agreement].slice(:repo_name, :text))

    if @agreement.save
      @agreement.create_github_repo_hook
      redirect_to agreement_path(user_name: @agreement.user_name, repo_name: @agreement.repo_name), notice: "Your Contributor License Ageement for beta is ready."
    else
      @repos = repos_for_current_user
      render 'new'
    end
  end

  def show
    @agreement = Agreement.find_by_user_name_and_repo_name(params[:user_name], params[:repo_name])

    if signed_out?
      session[:redirect_after_github_oauth_url] = request.url
    end
  end

  private

  def repos_for_current_user
    DevModeCache.cache("repos-for-#{current_user.uid}") do
      GithubRepos.new(current_user).repos
    end
  end

  def split_user_name_repo_name
    if params[:agreement]
      params[:agreement][:user_name], params[:agreement][:repo_name] =
        params[:agreement][:user_name_repo_name].split('/')
    end
  end
end
