class AgreementsController < ApplicationController
  def index
    @agreements = current_user.agreements
    @signatures = current_user.signatures
  end

  def new
    @agreement = current_user.agreements.new
    @agreement.build_default_fields
    @repos = repos_for_current_user
    @orgs = orgs_for_current_user
  end

  def create
    @agreement = current_user.agreements.new(params[:agreement].slice(:text, :agreement_fields_attributes))
    if params[:agreement]
      @agreement.user_name, @agreement.repo_name = params[:agreement][:user_name_repo_name].split('/')
      if @agreement.repo_name == GithubRepos::ALL_REPOS
        @agreement.other_repo_names = []
        for repo in org_repos_for_current_user(@agreement.user_name) do
          @agreement.other_repo_names << repo.name
        end
      end
    end

    if @agreement.save
      @agreement.create_github_repo_hook
      redirect_to agreement_path(user_name: @agreement.user_name, repo_name: @agreement.repo_name), notice: "Your Contributor License Ageement for #{@agreement.user_name}/#{@agreement.repo_name} is ready."
    else
      @agreement.build_default_fields
      @repos = repos_for_current_user
      @orgs = orgs_for_current_user
      render 'new'
    end
  end

  def show
    @agreement = Agreement.find_by_user_name_and_repo_name!(params[:user_name], params[:repo_name])

    if signed_out?
      session[:redirect_after_github_oauth_url] = request.url
    end

    respond_to do |format|
      format.html do
        @rendered_agreement_html = Kramdown::Document.new(@agreement.text).to_html
        @signature = @agreement.signatures.build
        @signature.build_default_field_entries
      end

      format.csv do
        if @agreement.owned_by?(current_user)
          filename = "#{@agreement.repo_name}-contributor-agreement-signatures-#{Time.now.strftime("%Y%m%d-%H%M%S")}.csv"
          headers["Content-Type"] ||= 'text/csv'
          headers["Content-Disposition"] = "attachment; filename=\"#{filename}\""
          render text: AgreementCsvPresenter.new(@agreement).to_csv
        else
          render nothing: true, status: 404
        end
      end
    end
  end

  private

  def repos_for_current_user
    DevModeCache.cache("repos-for-#{current_user.uid}") do
      GithubRepos.new(current_user).repos
    end
  end

  def orgs_for_current_user
    DevModeCache.cache("orgs-for-#{current_user.uid}") do
      GithubRepos.new(current_user).orgs
    end
  end

  def org_repos_for_current_user(org)
    DevModeCache.cache("org-repos-for-#{current_user.uid}-#{org}") do
      GithubRepos.new(current_user).org_repos(org)
    end
  end
end
