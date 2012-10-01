module GithubMockHelpers
  def mock_github_oauth(options={})
    options[:uid] ||= '12345'
    options[:info] ||= {}
    options[:info][:email] ||= 'jason.p.morrison@gmail.com'
    options[:info][:name] ||= 'Jason Morrison'
    options[:info][:nickname] ||= 'jasonm'
    options[:credentials] ||= {}
    options[:credentials][:token] ||= 'token-abcdef123456'

    OmniAuth.config.add_mock(:github, options)
    OmniAuth.config.test_mode = true
  end

  def mock_github_user_repos(options={})
    raise "must include :oauth_token" unless options[:oauth_token]
    raise "must include :repos" unless options[:repos]

    json_response = options[:repos].to_json
    stub_request(:get, "https://api.github.com/user/repos?access_token=#{options[:oauth_token]}").to_return(status: 200, body: json_response)
  end

  def mock_github_repo_hook(user_name, repo_name, token, result_hook_id)
    json_response = { url: 'http://something', id: result_hook_id }.to_json
    stub_request(:post, "https://api.github.com/repos/#{user_name}/#{repo_name}/hooks?access_token=#{token}").
      to_return(status: 201, body: json_response)
  end
end
