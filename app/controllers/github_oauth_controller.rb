class GithubOauthController < ApplicationController
  def callback
    auth = request.env['omniauth.auth']

    name     = auth.info.name
    nickname = auth.info.nickname
    uid      = auth.uid

    render text: "Welcome, #{name} (#{nickname} - #{uid})!"
  end
end
