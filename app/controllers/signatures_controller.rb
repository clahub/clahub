class SignaturesController < ApplicationController
  def create
    license = License.find_by_user_name_and_repo_name(params[:user_name], params[:repo_name])
    signature = Signature.new(license: license, user: current_user)

    if signature.save
      notice = "You have agreed to the CLA for #{license.user_name}/#{license.repo_name}."
      redirect_to license_url(user_name: license.user_name, repo_name: license.repo_name), notice: notice
    else
      render 'licenses/show', alert: 'There was an error agreeing to the license.'
    end
  end
end
