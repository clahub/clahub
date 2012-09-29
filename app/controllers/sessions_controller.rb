class SessionsController < ApplicationController
  def destroy
    sign_out
    redirect_to dashboard_url
  end
end
