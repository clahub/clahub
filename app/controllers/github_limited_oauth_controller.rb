class GithubLimitedOauthController < GithubOauthController
	def user_for_auth(auth)
	  User.find_or_create_for_github_oauth({
	    name:        auth.info.name,
	    nickname:    auth.info.nickname,
	    email:       auth.info.email,
	    uid:         auth.uid
	  })
	end
end
