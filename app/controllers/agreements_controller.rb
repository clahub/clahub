class AgreementsController < ApplicationController
  
  before_filter :check_if_member_of_hybridgroup, except: [:index, :show]
  before_filter :check_if_admin_of_repos, only: [:new, :create, :edit, :update]
  before_filter :load_repos, only: [:new, :create, :edit, :update]
  before_filter :load_agreement, only: [:show, :edit, :update]
  
  def index
    @agreements = current_user.agreements
    @signatures = current_user.signatures
  end

  def new
    @agreement = current_user.agreements.new
    @agreement.build_default_fields
  end

  def create
    # CHECK IF USER IS OWNER OR ADMIN OF THE SELECTED REPO
    @agreement = current_user.agreements.new(params[:agreement].slice(:name, :text, :github_repositories, :agreement_fields_attributes))

    if selected_repos_are_valid?
      if @agreement.save
        add_repos_to_agreement
        redirect_to @agreement, notice: "Your Contributor License Agreement is ready."
      else
        @agreement.build_default_fields
        render 'new'
      end
    else
      @agreement.build_default_fields
      render 'new'
    end
  end

  def show
    if signed_out?
      session[:redirect_after_github_oauth_url] = request.url
    end

    if @agreement
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
    else
      redirect_to agreements_url
    end
  end

  def edit
    session[:redirect_after_github_oauth_url] = request.url if signed_out?
    user_repos = @agreement.repositories.collect(&:name)
    @repos = @repos.reject{ |repo| user_repos.include?(repo.full_name) }
    @rendered_agreement_html = Kramdown::Document.new(@agreement.text).to_html
  end

  def update
    if selected_repos_are_valid?
      add_repos_to_agreement
      redirect_to @agreement, notice: 'Agreement updated successfully!'
    else
      redirect_to edit_agreement_path(@agreement)
    end
  end

  private
  
  def load_repos
    @repos = current_user.repos
  end
  
  def selected_repos_are_valid?
    if params[:agreement] && params[:agreement][:github_repositories]
      result = []
      repos_im_admin_of = @repos.collect(&:full_name)
      selected_repos = params[:agreement][:github_repositories].delete_if{|repo| repo.blank? }
      selected_repos.each do |selected_repo|
        result << repos_im_admin_of.include?(selected_repo)
      end
      !result.include?(false)
    else
      false
    end
  end

  def add_repos_to_agreement
    if params[:agreement] && params[:agreement][:github_repositories]
      repos = params[:agreement][:github_repositories].delete_if{ |repo| repo.blank? }
      repos.each do |r|
        repo = r.split('/')
        repository = Repository.create({agreement_id: @agreement.id, user_name: repo.first, repo_name: repo.last})
        repository.create_github_repo_hook
      end
    end
  end
    
  def check_if_admin_of_repos
    unless current_user.admin_of_repos?
      redirect_to home_url
    end
  end

  def load_agreement
    @agreement = Agreement.find(params[:id])
  end
end
