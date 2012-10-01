class LicensesController < ApplicationController
  def new
    @license = current_user.licenses.new(params.slice(:repo_name))
  end

  def create
    @license = current_user.licenses.new(params[:license].slice(:repo_name, :text))
    if @license.save
      @license.create_github_repo_hook
      redirect_to license_path(user_name: @license.user_name, repo_name: @license.repo_name), notice: "Your Contributor License Ageement for beta is ready."
    else
      render 'new'
    end
  end

  def show
    @license = License.find_by_user_name_and_repo_name(params[:user_name], params[:repo_name])

    if signed_out?
      session[:redirect_after_github_oauth_url] = request.url
    end
  end
end
