require 'digest/md5'

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

  def mock_github_oauth_failure(failure_message = :access_denied)
    OmniAuth.config.mock_auth[:github] = failure_message
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
    assert_options(options, :user_name, :repo_name, :sha)
    options[:oauth_token] ||= oauth_token_for(options[:user_name])

    json_response = options[:json_response] || { whatever: 'yeah' }.to_json
    url = "https://api.github.com/repos/#{options[:user_name]}/#{options[:repo_name]}/statuses/#{options[:sha]}?access_token=#{options[:oauth_token]}"
    stub_request(:post, url).to_return(status: 201, body: json_response)
  end

  # TODO refactor other mocks and default oauth_token based on owner/user_name where appropriate
  def mock_github_open_pulls(options = {})
    assert_options(options, :owner, :repo, :pull_ids)
    options[:oauth_token] ||= oauth_token_for(options[:owner])

    attributes_for_open_pulls = options[:pull_ids].map { |id|
      { "number" => id }
    }

    json_response = attributes_for_open_pulls.to_json
    url = "https://api.github.com/repos/#{options[:owner]}/#{options[:repo]}/pulls?access_token=#{options[:oauth_token]}"
    stub_request(:get, url).to_return(status: 200, body: json_response)
  end

  # options[:commits] is an array of hashes,
  # each hash can contain keys :committer, :author, :sha, :url, :commit{}
  def mock_github_pull_commits(options = {})
    assert_options(options, :owner, :repo, :pull_id, :commits)
    assert_options_array(options[:commits], :author, :sha)
    options[:oauth_token] ||= oauth_token_for(options[:owner])

    json_response = options[:commits].to_json
    url = "https://api.github.com/repos/#{options[:owner]}/#{options[:repo]}/pulls/#{options[:pull_id]}/commits?access_token=#{options[:oauth_token]}"
    stub_request(:get, url).to_return(status: 200, body: json_response)
  end

  def github_uid_for_nickname(nickname)
    # consistent and unique-enough string-to-4-byte-integer mapping
    User.find_by_nickname(nickname).try(:uid) || nickname.hash.abs.to_s[0..8].to_i
  end

  def oauth_token_for(nickname)
    User.find_by_nickname(nickname).try(:oauth_token) || Digest::MD5.hexdigest(nickname)
  end

  private

  def assert_options(options, *required_keys)
    required_keys.each do |key|
      raise "must include :#{key}" unless options[key]
    end
  end

  def assert_options_array(options_array, *required_keys)
    raise "options must include array but did not" unless options_array.is_a?(Array)
    options_array.each do |options|
      assert_options(options, *required_keys)
    end
  end
end
