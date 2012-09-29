# {"forks_count"=>0,
#  "language"=>"JavaScript",
#  "homepage"=>"http://www.kesiev.com/akihabara",
#  "git_url"=>"git://github.com/jasonm/akihabara.git",
#  "mirror_url"=>nil,
#  "owner"=>
#   {"login"=>"jasonm",
#    "avatar_url"=>
#     "https://secure.gravatar.com/avatar/8478f9ebe099ad853f022deeb2c1defe?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png",
#    "id"=>1031,
#    "url"=>"https://api.github.com/users/jasonm",
#    "gravatar_id"=>"8478f9ebe099ad853f022deeb2c1defe"},
#  "has_downloads"=>true,
#  "watchers_count"=>1,
#  "description"=>"Akihabara framework",
#  "open_issues_count"=>0,
#  "html_url"=>"https://github.com/jasonm/akihabara",
#  "created_at"=>"2012-03-18T10:11:00Z",
#  "has_wiki"=>true,
#  "has_issues"=>false,
#  "svn_url"=>"https://github.com/jasonm/akihabara",
#  "size"=>108,
#  "fork"=>true,
#  "pushed_at"=>"2012-03-18T10:11:27Z",
#  "forks"=>0,
#  "clone_url"=>"https://github.com/jasonm/akihabara.git",
#  "name"=>"akihabara",
#  "permissions"=>{"pull"=>true, "push"=>true, "admin"=>true},
#  "open_issues"=>0,
#  "watchers"=>1,
#  "ssh_url"=>"git@github.com:jasonm/akihabara.git",
#  "private"=>false,
#  "updated_at"=>"2012-03-18T10:11:28Z",
#  "full_name"=>"jasonm/akihabara",
#  "id"=>3754140,
#  "url"=>"https://api.github.com/repos/jasonm/akihabara"}

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

  def mock_user_repos(repo_hashes)
    Github::Repos.any_instance.stub(:list).and_return(repo_hashes)
  end
    # mock_user_repos([
    #   { "name" => "akihabara", "id" => 3754140, }
    # ])
end
