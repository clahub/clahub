class AgreementsController < ApplicationController
  
  before_filter :check_if_member_of_hybridgroup, except: [:index, :show]
  
  def index
    @agreements = current_user.agreements
    @signatures = current_user.signatures
    @member_of_hybridgroup = is_member_of_hybridgroup?
  end

  def new
    @agreement = current_user.agreements.new
    @agreement.build_default_fields
    @repos = repos_for_current_user
  end

  def create
    @agreement = current_user.agreements.new(params[:agreement].slice(:text, :github_repositories, :agreement_fields_attributes))

    if @agreement.save
      add_repos_to_agreement(params)
      redirect_to @agreement, notice: "Your Contributor License Agreement is ready."
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
        @signature = Signature.new(agreement: @agreement)
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

  def edit
    session[:redirect_after_github_oauth_url] = request.url if signed_out?
    @agreement = Agreement.find(params[:id])
    user_repos = @agreement.repositories.collect(&:name)
    @repos = repos_for_current_user.reject{ |repo| user_repos.include?(repo.full_name) }
    @rendered_agreement_html = Kramdown::Document.new(@agreement.text).to_html
  end

  def update
    @agreement = Agreement.find(params[:id])
    add_repos_to_agreement(params)
    redirect_to @agreement, notice: 'Agreement updated successfully!'
  end

  private

  def add_repos_to_agreement(params)
    if params[:agreement] && params[:agreement][:github_repositories]
      repos = params[:agreement][:github_repositories].delete_if{ |repo| repo.blank? }
      repos.each do |r|
        repo = r.split('/')
        repository = Repository.create({agreement_id: @agreement.id, user_name: repo.first, repo_name: repo.last})
        repository.create_github_repo_hook
      end
    end
  end

  def repos_for_current_user
    DevModeCache.cache("repos-for-#{current_user.uid}") do
      GithubRepos.new(current_user).repos
    end
  end
  
  def is_member_of_hybridgroup?
    repos_for_current_user.collect(&:owner).collect(&:login).include?(GithubRepos::ORGANIZATION)
    # true
  end
  
  def check_if_member_of_hybridgroup
    unless is_member_of_hybridgroup?
      redirect_to agreements_url, alert: "You must be a member of the #{GithubRepos::ORGANIZATION} organization and have admin rights over at least one repository to access that page"
    end
  end
end
