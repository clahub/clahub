class PagesController < ApplicationController
  SUPPRESS_NAVBAR_ON = %w(home)

  def show
    if params[:id] == 'home'
      @suppress_navbar = SUPPRESS_NAVBAR_ON.include?(params[:id])
      session[:redirect_after_github_oauth_url] = new_agreement_url
    end

    render template: "pages/#{params[:id]}"
  end
end
