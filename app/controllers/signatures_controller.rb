class SignaturesController < ApplicationController
  def create
    @agreement = Agreement.find(params[:id])
    @signature = Signature.new(params[:signature])
    @signature.agreement = @agreement
    @signature.ip = request.env["HTTP_X_FORWARDED_FOR"]
    @signature.user = current_user

    if @signature.save
      notice = "You have agreed to the CLA for #{@agreement.repositories_with_user_repo.join(',')}."
      redirect_to agreement_url(@agreement), notice: notice
    else
      @rendered_agreement_html = Kramdown::Document.new(@agreement.text).to_html
      render 'agreements/show', alert: 'There was an error signing the agreement.'
    end
  end
end
