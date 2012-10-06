class SignaturesController < ApplicationController
  def create
    agreement = Agreement.find_by_user_name_and_repo_name(params[:user_name], params[:repo_name])
    signature = Signature.new(agreement: agreement, user: current_user)

    if signature.save
      notice = "You have agreed to the CLA for #{agreement.user_name}/#{agreement.repo_name}."
      redirect_to agreement_url(user_name: agreement.user_name, repo_name: agreement.repo_name), notice: notice
    else
      render 'agreements/show', alert: 'There was an error signing the agreement.'
    end
  end
end
