class GithubOauthController < ApplicationController
  def callback
    auth = request.env['omniauth.auth']
    user = user_for_auth(auth)
    sign_in(user)

    redirect_to redirect_url_after_callback, notice: welcome(user)
  end

  private

  def redirect_url_after_callback
    session.delete(:redirect_after_github_oauth_url) || new_agreement_url
  end

  def welcome(user)
    "Welcome, #{user.name} (#{user.nickname} - #{user.uid})!"
  end

  def user_for_auth(auth)
    User.find_or_create_for_github_oauth({
      oauth_token: auth.credentials.token,
      name:        auth.info.name,
      nickname:    auth.info.nickname,
      email:       auth.info.email,
      uid:         auth.uid
    })
  end
end
