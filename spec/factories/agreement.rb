FactoryGirl.define do
  factory :agreement do
    association :user
    text "Generic CLA text"
    github_repositories ["some_user/some_repo"]
  end
  
end
