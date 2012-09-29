class LicensesController < ApplicationController
  def new
    @license = current_user.licenses.new(params.slice(:repo_name))
  end

  def create

  end
end
