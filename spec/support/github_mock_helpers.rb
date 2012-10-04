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
    assert_options(options, :oauth_token, :repos)

    json_response = options[:repos].to_json
    stub_request(:get, "https://api.github.com/user/repos?access_token=#{options[:oauth_token]}&per_page=1000").to_return(status: 200, body: json_response)
  end

  def mock_github_repo_hook(options={})
    assert_options(options, :oauth_token, :user_name, :repo_name, :resulting_hook_id)

    json_response = { url: 'http://something', id: options[:resulting_hook_id] }.to_json
    stub_request(:post, "https://api.github.com/repos/#{options[:user_name]}/#{options[:repo_name]}/hooks?access_token=#{options[:oauth_token]}").
      to_return(status: 201, body: json_response)
  end

  def mock_github_set_commit_status(options={})
    assert_options(options, :oauth_token, :user_name, :repo_name, :sha)

    json_response = options[:json_response] || { whatever: 'yeah' }.to_json
    url = "https://api.github.com/repos/#{options[:user_name]}/#{options[:repo_name]}/statuses/#{options[:sha]}?access_token=#{options[:oauth_token]}"
    stub_request(:post, url).to_return(status: 201, body: json_response)
  end

  private

  def assert_options(options, *required_keys)
    required_keys.each do |key|
      raise "must include :#{key}" unless options[key]
    end
  end
end
