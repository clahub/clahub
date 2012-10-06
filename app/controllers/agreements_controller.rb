class AgreementsController < ApplicationController
  def new
    @agreement = current_user.agreements.new(params.slice(:repo_name))
  end

  def create
    @agreement = current_user.agreements.new(params[:agreement].slice(:repo_name, :text))
    if @agreement.save
      @agreement.create_github_repo_hook
      redirect_to agreement_path(user_name: @agreement.user_name, repo_name: @agreement.repo_name), notice: "Your Contributor License Ageement for beta is ready."
    else
      render 'new'
    end
  end

  def show
    @agreement = Agreement.find_by_user_name_and_repo_name(params[:user_name], params[:repo_name])

    if signed_out?
      session[:redirect_after_github_oauth_url] = request.url
    end
  end
end
