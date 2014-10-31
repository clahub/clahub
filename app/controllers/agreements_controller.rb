class AgreementsController < ApplicationController
  def index
    @agreements = current_user.agreements
    @signatures = current_user.signatures
  end

  def new
    @agreement = current_user.agreements.new
    @agreement.build_default_fields
    @repos = repos_for_current_user
  end

  def create
    @agreement = current_user.agreements.new(params[:agreement].slice(:text, :github_repositories, :agreement_fields_attributes))

    if @agreement.save
      if params[:agreement] && params[:agreement][:github_repositories]
        repos = params[:agreement][:github_repositories].delete_if{ |repo| repo.blank? }
        repos.each do |r|
          repo = r.split('/')
          repository = Repository.create({agreement_id: @agreement.id, user_name: repo.first, repo_name: repo.last})
          repository.create_github_repo_hook
        end
      end
      redirect_to @agreement, notice: "Your Contributor License Ageement is ready."
    else
      @agreement.build_default_fields
      @repos = repos_for_current_user
      render 'new'
    end
  end

  def show
    @agreement = Agreement.find(params[:id])

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
          filename = "#{@agreement.repository_names_for_csv}-contributor-agreement-signatures-#{Time.now.strftime("%Y%m%d-%H%M%S")}.csv"
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
end
