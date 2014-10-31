FactoryGirl.define do
  factory :agreement do
    association :user
    text "Generic CLA text"
    github_repositories ["some_user/some_repo"]
    
    after(:create) do |agreement|
      # puts "================ #{agreement.inspect}"
      agreement.github_repositories.each do |repo|
        r = repo.split('/')
        agreement.repositories << create(:repository, user_name: r.first, repo_name: r.last)
      end
    end
  end
  
end
