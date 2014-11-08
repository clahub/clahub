class GithubOauthController < ApplicationController
  def callback
    auth = request.env['omniauth.auth']
    user = user_for_auth(auth)
    sign_in(user)

    redirect_to redirect_url_after_callback, notice: welcome(user)
  end

  def failure
    redirect_to home_url, alert: "You'll need to sign into GitHub.  Maybe next time?"
  end

  private

  def redirect_url_after_callback
    session.delete(:redirect_after_github_oauth_url) || agreements_url
  end

  def welcome(user)
    "Welcome, #{user.name} (#{user.nickname})!"
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
